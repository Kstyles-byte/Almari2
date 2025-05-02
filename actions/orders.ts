"use server";

import { auth } from "../auth";
import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from "next/cache";
import { getCustomerByUserId } from "../lib/services/customer";
import { initializePayment, verifyPayment } from "../lib/paystack";
import { findNearestAgent, generatePickupCode } from "../lib/services/agent";
import { createOrderStatusNotification } from "../lib/services/notification";
import type { Customer, Product, Cart, CartItem, Order, OrderItem, Agent } from '../types/index';
import type { Tables } from '../types/supabase';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error("Supabase URL/Key missing in order actions.");
}
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

/**
 * Create a new order
 */
export async function createOrder(formData: FormData) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return { error: "Unauthorized" };
    }
    
    // Get customer profile using migrated service
    const customer = await getCustomerByUserId(session.user.id);
    
    if (!customer) {
      return { error: "Customer profile not found" };
    }
    
    const shippingAddress = formData.get("shippingAddress") as string;
    
    // Validate shipping address
    if (!shippingAddress) {
      return { error: "Shipping address is required" };
    }
    
    // Get cart items using Supabase
    const { data: cartData, error: cartError } = await supabase
      .from('Cart')
      .select(`
        id,
        CartItem ( quantity, Product (*) )
      `)
      .eq('customerId', customer.id)
      .maybeSingle(); 

    if (cartError) {
        console.error("Error fetching cart:", cartError.message);
        throw new Error("Failed to fetch cart information.");
    }

    // Adjust type assertion: Product is likely an array
    type CartItemWithProductArray = { 
        quantity: number; 
        Product: Tables<'Product'>[] | null
    };
    const cartItems = (cartData?.CartItem || []) as CartItemWithProductArray[];

    if (!cartData || cartItems.length === 0) {
      return { error: "Cart is empty" };
    }
    
    // Check inventory for all items
    for (const item of cartItems) {
      // Access the first product in the array
      const product = item.Product?.[0]; 
      if (!product) {
          // This could happen if the FK relation is broken or product deleted
          return { error: `Product data missing for an item in cart.` };
      }
      if (product.inventory < item.quantity) {
        return {
          error: `Not enough inventory for product: ${product.name}`,
          productId: product.id,
        };
      }
    }
    
    // Calculate total
    const total = cartItems.reduce((sum, item) => {
        // Access the first product in the array safely
        const product = item.Product?.[0];
        return sum + (item.quantity * (product?.price || 0));
      }, 0);
    
    // Find nearest agent (using migrated service)
    const agent = await findNearestAgent(shippingAddress);
    
    if (!agent) {
      return { error: "No available agent found for your location" };
    }
    
    // --- Transaction Logic Start (Conceptual - Supabase doesn't have direct transactions like Prisma) ---
    // We need to perform multiple inserts/updates. If one fails, we should ideally roll back.
    // This usually requires creating a Supabase Database Function (using PL/pgSQL) to handle the logic atomically.
    // For simplicity here, we proceed step-by-step, but be aware of potential partial failures.

    // 1. Create order
    const pickupCode = generatePickupCode(); // Generate pickup code
    const { data: newOrder, error: orderError } = await supabase
      .from('Order')
      .insert({
        customerId: customer.id,
        agentId: agent.id,
        total,
        shippingAddress,
        paymentStatus: "PENDING",
        status: "PENDING",
        pickupStatus: "PENDING",
        pickupCode: pickupCode, // Add pickup code
        // createdAt/updatedAt handled by DB
      })
      .select()
      .single();

    if (orderError || !newOrder) {
        console.error("Error creating order record:", orderError?.message);
        // TODO: Potential rollback logic needed if using DB function
        throw new Error(`Failed to create order: ${orderError?.message}`);
    }

    // 2. Create order items
    const orderItemInserts = cartItems.map(item => {
        const product = item.Product![0]; // Non-null assertion ok after inventory check
        return {
            orderId: newOrder.id,
            productId: product.id, 
            vendorId: product.vendor_id,
          quantity: item.quantity,
            price: product.price,
          status: "PENDING",
        };
      });

    const { data: insertedItems, error: itemError } = await supabase
        .from('OrderItem')
        .insert(orderItemInserts)
        .select(); // Select inserted items if needed

    if (itemError || !insertedItems || insertedItems.length !== cartItems.length) {
        console.error("Error creating order items:", itemError?.message);
        // TODO: Rollback needed - Delete the created Order record
        await supabase.from('Order').delete().eq('id', newOrder.id);
        throw new Error(`Failed to create order items: ${itemError?.message}`);
    }

    // 3. Initialize payment with Paystack (external call, less critical for rollback)
    let paymentReference: string | null = null;
    let authorizationUrl: string | null = null;
    try {
    const paymentResponse = await initializePayment({
      email: session.user.email as string,
          amount: Math.round(total * 100), // Kobo
      metadata: {
            orderId: newOrder.id,
        customerId: customer.id,
        agentId: agent.id,
      },
          // Ensure NEXTAUTH_URL is set correctly in your environment
          callback_url: `${process.env.NEXTAUTH_URL}/checkout/complete?orderId=${newOrder.id}`,
        });
        if (paymentResponse?.status && paymentResponse?.data?.reference) {
            paymentReference = paymentResponse.data.reference;
            authorizationUrl = paymentResponse.data.authorization_url;

            // Optionally, update the order with the payment reference immediately
            await supabase.from('Order').update({ paymentReference }).eq('id', newOrder.id);
        } else {
             console.error("Paystack initialization failed:", paymentResponse?.message);
             // Decide if this should stop the process or allow proceeding without payment URL
             // For now, we allow proceeding but log the error.
        }
    } catch(payError: any) {
        console.error("Error initializing Paystack payment:", payError);
        // Allow proceeding without payment URL if initialization fails?
    }

    // 4. Clear cart (use cartData.id from the fetch earlier)
    if (cartData?.id) {
        const { error: clearCartError } = await supabase
            .from('CartItem')
            .delete()
            .eq('cartId', cartData.id);
        if (clearCartError) {
             console.error("Error clearing cart items:", clearCartError.message);
             // This is less critical, log but don't fail the whole order creation
        }
    } else {
         console.warn("Could not clear cart, cart ID not found.");
    }

    // --- Transaction Logic End --- 
    
    revalidatePath("/cart");
    revalidatePath("/customer/orders");
    
    return {
      success: true,
      order: {
        id: newOrder.id,
        total,
        agent: {
          name: agent.name,
          address: `${agent.address_line1}, ${agent.city}`,
        },
      },
      payment: {
        reference: paymentReference, // May be null if Paystack failed
        authorizationUrl: authorizationUrl, // May be null if Paystack failed
      },
    };
  } catch (error) {
    console.error("Error creating order action:", error);
    return { error: error instanceof Error ? error.message : "Failed to create order" };
  }
}

/**
 * Verify an order payment
 */
export async function verifyOrderPayment(formData: FormData) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return { error: "Unauthorized" };
    }
    
    const orderId = formData.get("orderId") as string;
    const paymentReference = formData.get("paymentReference") as string;
    
    if (!orderId || !paymentReference) {
      return { error: "Order ID and payment reference are required" };
    }
    
    // Get the order using Supabase
    const { data: order, error: orderFetchError } = await supabase
      .from('Order')
      .select('id, status, paymentStatus, total')
      .eq('id', orderId)
      .single();

    if (orderFetchError || !order) {
      console.error("Verify Payment - Order fetch error:", orderFetchError?.message);
      return { error: "Order not found" };
    }

    // Avoid re-verifying if already completed
    if (order.paymentStatus === 'COMPLETED') {
        console.log(`Order ${orderId} payment already verified.`);
        return { success: true, status: "completed" };
    }
    
    // Verify payment with Paystack
    let verificationData: any;
    try {
    const verificationResult = await verifyPayment(paymentReference);
        if (!verificationResult || !verificationResult.status || !verificationResult.data) {
             throw new Error(verificationResult?.message || "Paystack verification failed: Invalid response");
        }
        verificationData = verificationResult.data;
    } catch (verifyError: any) {
         console.error("Paystack verification error:", verifyError);
         // Optionally update order status to FAILED here based on verification error
         await supabase.from('Order').update({ paymentStatus: "FAILED", paymentReference }).eq('id', orderId);
         return { error: "Payment verification failed", status: "failed" };
    }

    // --- Transaction Logic Start (Conceptual) --- 

    // 1. Update order payment status
    if (verificationData.status === "success") {
        // Ensure amount paid matches order total (Paystack amount is in kobo)
        const amountPaidKobo = verificationData.amount;
        const orderTotalKobo = Math.round(order.total * 100);
        if (amountPaidKobo < orderTotalKobo) {
             console.warn(`Order ${orderId}: Amount paid (${amountPaidKobo}) is less than order total (${orderTotalKobo}). Marking as failed.`);
             await supabase.from('Order').update({ paymentStatus: "FAILED", paymentReference }).eq('id', orderId);
             return { success: false, status: "failed", error: "Amount paid does not match order total." };
        }

      const { error: orderUpdateError } = await supabase
          .from('Order')
          .update({
          paymentStatus: "COMPLETED",
            paymentReference, // Ensure the verified reference is stored
            status: "PROCESSING", 
          })
          .eq('id', orderId);

      if (orderUpdateError) {
          console.error("Error updating order status post-payment:", orderUpdateError.message);
          // Critical error, payment received but DB update failed
          // TODO: Implement retry or alert mechanism
          return { error: "Failed to update order status after payment confirmation.", status: "error" };
      }

      // 2. Update product inventory
      // Fetch order items first
      const { data: orderItems, error: itemFetchError } = await supabase
          .from('OrderItem')
          .select('productId, quantity')
          .eq('orderId', orderId);

      if (itemFetchError || !orderItems) {
          console.error("Error fetching order items for inventory update:", itemFetchError?.message);
          // Critical error: Order paid, but can't update stock
          return { error: "Failed to fetch order items for inventory update.", status: "error" };
      }

      // Use Supabase Edge Function for atomic inventory update if possible
      // Otherwise, update one by one (less safe)
      const inventoryUpdatePromises = orderItems.map(item => 
          supabase.rpc('decrement_product_inventory', { 
              p_product_id: item.productId, 
              p_decrement_quantity: item.quantity 
          })
      );
      // Example RPC function (in Supabase SQL editor):
      // CREATE OR REPLACE FUNCTION decrement_product_inventory(p_product_id UUID, p_decrement_quantity INT)
      // RETURNS VOID AS $$
      // BEGIN
      //   UPDATE public."Product"
      //   SET inventory = inventory - p_decrement_quantity
      //   WHERE id = p_product_id AND inventory >= p_decrement_quantity;
      // 
      //   IF NOT FOUND THEN
      //     RAISE EXCEPTION 'Product not found or not enough inventory for product ID %', p_product_id;
      //   END IF;
      // END;
      // $$ LANGUAGE plpgsql;

      const inventoryResults = await Promise.allSettled(inventoryUpdatePromises);
      const failedUpdates = inventoryResults.filter(res => res.status === 'rejected');

      if (failedUpdates.length > 0) {
           console.error("Failed to update inventory for some items:", failedUpdates);
           // Critical: Order paid, inventory not fully updated
           // TODO: Need reconciliation/alert mechanism
           return { error: "Failed to update inventory for some items.", status: "error" };
      }

      // 3. Create notifications (use migrated service)
      await createOrderStatusNotification(orderId, "PROCESSING");

       // --- Transaction Logic End --- 
      
      revalidatePath(`/customer/orders/${orderId}`);
      revalidatePath("/customer/orders");
      
      return { success: true, status: "completed" };

    } else { // Payment verification status was not 'success'
      const { error: failUpdateError } = await supabase
          .from('Order')
          .update({
          paymentStatus: "FAILED",
            paymentReference, // Store the reference even if failed
          })
          .eq('id', orderId);

       if (failUpdateError) {
           console.error("Error updating order to FAILED payment status:", failUpdateError.message);
           // Less critical, but log it
       }
      
      // Notify about failed payment
      await createOrderStatusNotification(orderId, "PAYMENT_FAILED");
      
      revalidatePath(`/customer/orders/${orderId}`);
      revalidatePath("/customer/orders");
      
      return { success: false, status: "failed", error: `Payment status: ${verificationData.status}` };
    }
  } catch (error) {
    console.error("Error verifying payment action:", error);
    return { error: error instanceof Error ? error.message : "Failed to verify payment" };
  }
}

/**
 * Cancel an order
 */
export async function cancelOrder(formData: FormData) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return { error: "Unauthorized" };
    }
    
    const orderId = formData.get("orderId") as string;
    
    if (!orderId) {
      return { error: "Order ID is required" };
    }
    
    // Get the order and customer userId using Supabase
    const { data: order, error: fetchError } = await supabase
      .from('Order')
      .select(`
        id, 
        status, 
        paymentStatus, 
        customerId, 
        Customer:customerId (userId)
      `)
      .eq('id', orderId)
      .single();

    if (fetchError || !order) {
      console.error("Cancel Order - fetch error:", fetchError?.message);
      return { error: "Order not found" };
    }
    
    // Check authorization (Admin or Customer owns the order)
    const customerUserId = (order as any).Customer?.userId;
    if (
      session.user.role !== "ADMIN" &&
      customerUserId !== session.user.id
    ) {
      return { error: "Not authorized to cancel this order" };
    }
    
    // Can only cancel PENDING orders (or maybe PROCESSING if payment failed?)
    if (order.status !== "PENDING" && order.paymentStatus !== 'FAILED') { // Allow cancelling if payment failed too
      return { error: "Can only cancel orders that are pending or failed payment." };
    }
    // Cannot cancel orders that have been paid and are processing/shipped etc.
    if (order.paymentStatus === 'COMPLETED' && order.status !== 'PENDING') {
        return { error: `Cannot cancel order with status ${order.status} after payment.` };
    }

    // --- Transaction Logic Start (Conceptual) --- 

    // 1. Update order status
    const { error: orderUpdateError } = await supabase
        .from('Order')
        .update({ status: "CANCELLED", paymentStatus: "CANCELLED" }) // Also mark payment as cancelled
        .eq('id', orderId);

    if (orderUpdateError) {
         console.error("Error cancelling order (order update):", orderUpdateError.message);
         throw new Error(`Failed to cancel order: ${orderUpdateError.message}`);
    }

    // 2. Update all order items status
    const { error: itemUpdateError } = await supabase
      .from('OrderItem')
      .update({ status: "CANCELLED" })
      .eq('orderId', orderId);

    if (itemUpdateError) {
      console.error("Error cancelling order (item update):", itemUpdateError.message);
       // Inconsistent state: Order cancelled, items not. Log and possibly try rollback/alert
      throw new Error(`Failed to cancel order items: ${itemUpdateError.message}`);
    }

    // 3. Restore inventory IF order was paid and is now cancelled (before shipping)
    // This logic is complex. Only restore if payment was COMPLETED but status was still PROCESSING/PENDING?
    // If payment was just PENDING or FAILED, inventory wasn't decremented yet.
    // For simplicity, we currently only decrement inventory on successful payment verification.
    // So, no inventory restoration needed here unless the logic changes.

    // --- Transaction Logic End --- 

    // Create notifications for order status change (use migrated service)
    await createOrderStatusNotification(orderId, "CANCELLED");
    
    revalidatePath(`/customer/orders/${orderId}`);
    revalidatePath("/customer/orders");
    
    return { success: true };
  } catch (error) {
    console.error("Error cancelling order action:", error);
    return { error: error instanceof Error ? error.message : "Failed to cancel order" };
  }
} 