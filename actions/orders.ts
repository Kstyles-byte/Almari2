"use server";

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from "next/cache";
import { getCustomerByUserId } from "../lib/services/customer";
import { initializePayment, verifyPayment } from "../lib/paystack";
import { findNearestAgent, generatePickupCode } from "../lib/services/agent";
import { createOrderStatusNotification } from "../lib/services/notification";
import type { Customer, Product, Cart, CartItem, Order, OrderItem, Agent } from '../types/index';
import type { Tables } from '../types/supabase';
import { createSupabaseServerActionClient } from '../lib/supabase/action';

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
  console.log("--- createOrder action started ---"); // Log start
  try {
    // Create the Supabase client for this specific action context - now with await
    const supabaseActionClient = await createSupabaseServerActionClient();
    console.log("Attempting to get user via Supabase client...");
    // Get the user session using the Supabase client
    const { data: { user }, error: authError } = await supabaseActionClient.auth.getUser(); 
    
    console.log("Supabase auth getUser response:", { user, error: authError }); // Log the response
    
    if (authError || !user) {
      console.error("Authorization failed:", authError?.message || "User not found."); 
      return { error: "Unauthorized" };
    }
    
    console.log(`User ${user.id} authorized. Proceeding...`); 
    
    // Get customer profile using migrated service (use user.id from Supabase Auth)
    const customer = await getCustomerByUserId(user.id);
    
    if (!customer) {
      return { error: "Customer profile not found" };
    }

    // Add debug log for customer object
    console.log("Retrieved customer profile:", customer);
    console.log("Customer ID from profile:", customer.id);
    console.log("User ID from auth:", user.id);
    
    // Get the selected agent ID
    const agentId = formData.get("agentId") as string;
    if (!agentId) {
      return { error: "Agent ID is required" };
    }
    
    // Fetch the agent
    const { data: selectedAgent, error: agentError } = await supabase
      .from('Agent')
      .select('*')
      .eq('id', agentId)
      .single();
      
    if (agentError || !selectedAgent) {
      console.error("Error fetching agent:", agentError?.message);
      return { error: "Agent not found" };
    }
    
    // Determine shipping address based on delivery method
    let shippingAddress = '';
    const deliveryMethod = formData.get("deliveryMethod") as string;
    
    if (deliveryMethod === 'delivery') {
      // Get address from selected address or form fields
      const selectedAddressId = formData.get("selectedAddressId") as string;
      
      if (selectedAddressId) {
        // Fetch selected address
        const { data: address, error: addressError } = await supabase
          .from('Address')
          .select('*')
          .eq('id', selectedAddressId)
          .single();
          
        if (addressError || !address) {
          console.error("Error fetching address:", addressError?.message);
          return { error: "Selected address not found" };
        }
        
        shippingAddress = `${address.addressLine1}, ${address.city}, ${address.stateProvince}`;
      } else {
        // Construct address from form fields
        const addressLine1 = formData.get("addressLine1") as string;
        const city = formData.get("city") as string;
        const stateProvince = formData.get("stateProvince") as string;
        
        if (!addressLine1 || !city || !stateProvince) {
          return { error: "Address information is incomplete" };
        }
        
        shippingAddress = `${addressLine1}, ${city}, ${stateProvince}`;
        
        // Save address if requested
        const saveAddress = formData.get("saveAddress") === 'true';
        if (saveAddress) {
          const addressLine2 = formData.get("addressLine2") as string;
          const postalCode = formData.get("postalCode") as string;
          const country = formData.get("country") as string;
          
          const { error: saveAddressError } = await supabase
            .from('Address')
            .insert({
              userId: user.id,
              addressLine1,
              addressLine2,
              city,
              stateProvince,
              postalCode,
              country,
              isDefault: false
            });
            
          if (saveAddressError) {
            console.error("Error saving address:", saveAddressError.message);
            // Non-critical error, continue with order
          }
        }
      }
    } else {
      // For pickup, use agent's address as shipping address
      shippingAddress = `Pickup at: ${selectedAgent.name}, ${selectedAgent.address_line1}, ${selectedAgent.city}`;
    }
    
    // --- Fetch Cart Items and Products Separately ---
    console.log("Fetching cart ID using customer_id:", customer.id);
    
    // 1. Get the Cart ID first
    const { data: cartDetails, error: cartDetailsError } = await supabase
      .from('Cart')
      .select('id')
      .eq('customer_id', customer.id)
      .maybeSingle();

    if (cartDetailsError) {
      console.error("Error fetching cart details:", cartDetailsError.message);
      return { error: `Failed to fetch cart details: ${cartDetailsError.message}` };
    }
    
    if (!cartDetails) {
      console.log("No active cart found for customer:", customer.id);
      return { error: "Cart is empty" };
    }
    
    const cartId = cartDetails.id;
    console.log("Found Cart ID:", cartId);

    // 2. Get CartItems associated with the Cart ID
    console.log("Fetching CartItems for cart ID:", cartId);
    const { data: rawCartItems, error: cartItemsError } = await supabase
      .from('CartItem')
      .select('id, quantity, product_id') 
      .eq('cart_id', cartId);

    if (cartItemsError) {
      console.error("Error fetching cart items:", cartItemsError.message);
      return { error: `Failed to fetch cart items: ${cartItemsError.message}` };
    }

    if (!rawCartItems || rawCartItems.length === 0) {
      console.log("Cart found but contains no items.");
      return { error: "Cart is empty" };
    }
    
    console.log("Raw CartItems fetched:", rawCartItems);

    // 3. Extract unique Product IDs
    const productIds = [...new Set(rawCartItems.map(item => item.product_id).filter(id => id))]; // <--- FIX: Use item.product_id
    console.log("Unique Product IDs from cart:", productIds);

    if (productIds.length === 0) {
        console.error("Cart items found, but no valid product IDs associated.");
        return { error: "Cart contains items with missing product references." };
    }

    // 4. Fetch Product details for those IDs
    console.log("Fetching product details for IDs:", productIds);
    const { data: productsData, error: productsError } = await supabase
      .from('Product')
      .select('id, name, price, inventory, vendor_id') // Select needed fields
      .in('id', productIds);

    if (productsError) {
      console.error("Error fetching product details:", productsError.message);
      return { error: `Failed to fetch product details: ${productsError.message}` };
    }
    
    if (!productsData || productsData.length === 0) {
        console.error("Failed to fetch details for products in cart, product IDs:", productIds);
        return { error: "Could not retrieve information for products in cart." };
    }

    // Create a map for easy lookup: productId -> product data
    const productMap = new Map(productsData.map(p => [p.id, p]));
    console.log("Product details map created.");

    // 5. Combine CartItems with Product data
    const cartItems = rawCartItems.map(item => ({
      ...item,
      product: productMap.get(item.product_id) // <--- FIX: Use item.product_id for lookup
    }));
    
    console.log("Combined cart items with product data:", cartItems);
    // --- End of new fetching logic ---
    
    // Check inventory for all items (using the new cartItems structure)
    for (const item of cartItems) {
      const product = item.product; // Access product directly
      if (!product) {
          // This should ideally not happen now if products were fetched correctly
          console.error(`Product data missing for cart item ID: ${item.id}, product_id: ${item.product_id}. This indicates an issue after product fetch.`); // <--- FIX: Log product_id
          return { error: `Product data inconsistent for item in cart (ID: ${item.product_id}).` }; // <--- FIX: Use product_id in error
      }
      if (product.inventory < item.quantity) {
        return {
          error: `Not enough inventory for product: ${product.name} (Available: ${product.inventory}, Requested: ${item.quantity})`,
          productId: product.id,
        };
      }
    }
    console.log("Inventory check passed.");
    
    // Calculate total (using the new cartItems structure)
    const total = cartItems.reduce((sum, item) => {
        const product = item.product;
        // Ensure price is a number, default to 0 if not
        const price = typeof product?.price === 'number' ? product.price : 0;
        return sum + (item.quantity * price);
      }, 0);
    console.log("Calculated total:", total);
    
    // Find nearest agent (using migrated service)
    // const agent = await findNearestAgent(shippingAddress);
    
    // if (!agent) {
    //   return { error: "No available agent found for your location" };
    // }
    
    // --- Transaction Logic Start (Conceptual - Supabase doesn't have direct transactions like Prisma) ---
    // We need to perform multiple inserts/updates. If one fails, we should ideally roll back.
    // This usually requires creating a Supabase Database Function (using PL/pgSQL) to handle the logic atomically.
    // For simplicity here, we proceed step-by-step, but be aware of potential partial failures.

    // 1. Create order
    const pickupCode = generatePickupCode(); // Generate pickup code
    const { data: newOrder, error: orderError } = await supabase
      .from('Order')
      .insert({
        customer_id: customer.id,
        agent_id: selectedAgent.id,
        total_amount: total,
        subtotal: total,
        discount_amount: 0,
        tax_amount: 0,
        shipping_amount: 0,
        payment_status: "PENDING",
        status: "PENDING",
        pickup_status: "PENDING",
        pickup_code: pickupCode,
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
        const product = item.product;
        if (!product) {
            // This should be caught earlier, but adding a safeguard
            throw new Error(`Cannot create order item, product data missing for product_id: ${item.product_id}`); // <--- FIX: Use product_id in error
        }
        return {
            order_id: newOrder.id,
            product_id: product.id,
            vendor_id: product.vendor_id,
            quantity: item.quantity,
            price_at_purchase: typeof product.price === 'number' ? product.price : 0, // <--- FIX: Use price_at_purchase
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
    
    // Determine the base URL dynamically for the callback
    const protocol = process.env.NODE_ENV === 'production' ? 'https://' : 'http://';
    // Use VERCEL_URL if available (set by Vercel, defaults to localhost:3000 in `vercel dev`), otherwise fallback
    const host = process.env.VERCEL_URL || 'localhost:3000'; 
    const baseUrl = `${protocol}${host}`;
    
    const callback_url = `${baseUrl}/checkout/complete?orderId=${newOrder.id}`;
    console.log("Using Paystack Callback URL:", callback_url); // Log the generated URL
    
    try {
      const paymentResponse = await initializePayment({
        email: user.email as string,
            amount: Math.round(total * 100), // Kobo
        metadata: {
              orderId: newOrder.id,
          customerId: customer.id,
          agentId: selectedAgent.id,
        },
            // Use the dynamically generated callback URL
            callback_url: callback_url,
          });
        if (paymentResponse?.status && paymentResponse?.data?.reference) {
            paymentReference = paymentResponse.data.reference;
            authorizationUrl = paymentResponse.data.authorization_url;

            // Optionally, update the order with the payment reference immediately
            await supabase.from('Order').update({ payment_reference: paymentReference }).eq('id', newOrder.id);
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
    if (cartId) { 
        console.log("Clearing cart with ID:", cartId);
        const { error: clearCartError } = await supabase
            .from('CartItem')
            .delete()
            .eq('cart_id', cartId);
        if (clearCartError) {
             console.error("Error clearing cart items:", clearCartError.message);
        }
    } else {
         console.warn("Could not clear cart, cart ID was not determined earlier.");
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
          name: selectedAgent.name,
          address: `${selectedAgent.address_line1}, ${selectedAgent.city}`,
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
  console.log("--- verifyOrderPayment action started ---");
  try {
    // Use Supabase client to verify auth
    const supabaseActionClient = await createSupabaseServerActionClient();
    const { data: { user }, error: authError } = await supabaseActionClient.auth.getUser();

    if (authError || !user) {
      console.error("verifyOrderPayment - Authorization failed:", authError?.message || "User not found.");
      return { error: "Unauthorized - Please login again to verify your payment." };
    }
    console.log(`User ${user.id} authorized for payment verification.`);

    const orderId = formData.get("orderId") as string;
    const paymentReference = formData.get("paymentReference") as string;
    
    if (!orderId || !paymentReference) {
      return { error: "Order ID and payment reference are required" };
    }
    
    // Get the order using Supabase
    const { data: order, error: orderFetchError } = await supabase
      .from('Order')
      .select('id, status, payment_status, total_amount')
      .eq('id', orderId)
      .single();

    if (orderFetchError || !order) {
      console.error("Verify Payment - Order fetch error:", orderFetchError?.message);
      return { error: "Order not found or could not be verified. Please contact support." };
    }

    // Avoid re-verifying if already completed
    if (order.payment_status === 'COMPLETED') {
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
         await supabase.from('Order').update({ payment_status: "FAILED", payment_reference: paymentReference }).eq('id', orderId);
         return { error: "Payment verification failed", status: "failed" };
    }

    // --- Transaction Logic Start (Conceptual) --- 

    // 1. Update order payment status
    if (verificationData.status === "success") {
        // Ensure amount paid matches order total (Paystack amount is in kobo)
        const amountPaidKobo = verificationData.amount;
        const orderTotalKobo = Math.round(order.total_amount * 100);
        if (amountPaidKobo < orderTotalKobo) {
             console.warn(`Order ${orderId}: Amount paid (${amountPaidKobo}) is less than order total (${orderTotalKobo}). Marking as failed.`);
             await supabase.from('Order').update({ payment_status: "FAILED", payment_reference: paymentReference }).eq('id', orderId);
             return { success: false, status: "failed", error: "Amount paid does not match order total." };
        }

      const { error: orderUpdateError } = await supabase
          .from('Order')
          .update({
          payment_status: "COMPLETED",
            payment_reference: paymentReference, // Ensure the verified reference is stored
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
          .select('product_id, quantity')
          .eq('order_id', orderId);

      if (itemFetchError || !orderItems) {
          console.error("Error fetching order items for inventory update:", itemFetchError?.message);
          // Critical error: Order paid, but can't update stock
          return { error: "Failed to fetch order items for inventory update.", status: "error" };
      }

      // Use Supabase Edge Function for atomic inventory update if possible
      // Otherwise, update one by one (less safe)
      const inventoryUpdatePromises = orderItems.map(item => 
          supabase.rpc('decrement_product_inventory', { 
              p_product_id: item.product_id, 
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
          payment_status: "FAILED",
            payment_reference: paymentReference, // Store the reference even if failed
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
  console.log("--- cancelOrder action started ---");
  try {
    // Use Supabase client to verify auth
    const supabaseActionClient = await createSupabaseServerActionClient();
    const { data: { user }, error: authError } = await supabaseActionClient.auth.getUser();

    if (authError || !user) {
      console.error("cancelOrder - Authorization failed:", authError?.message || "User not found.");
      return { error: "Unauthorized" };
    }
    console.log(`User ${user.id} authorized for order cancellation.`);
    
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
        payment_status, 
        customerId, 
        Customer:customerId (userId)
      `)
      .eq('id', orderId)
      .single();

    if (fetchError || !order) {
      console.error("Cancel Order - fetch error:", fetchError?.message);
      return { error: "Order not found" };
    }
    
    // Example RBAC adjustment:
    // Check authorization (Admin or Customer owns the order)
    const customerUserId = (order as any).Customer?.userId; 
    const { data: profileData } = await (await supabaseActionClient).from('User').select('role').eq('id', user.id).single(); // Get role if needed
    const userRole = profileData?.role;

    if (
      userRole !== "ADMIN" && // Check role from fetched profile if needed
      customerUserId !== user.id // Check ownership against Supabase user.id
    ) {
      return { error: "Not authorized to cancel this order" };
    }
    
    // Can only cancel PENDING orders (or maybe PROCESSING if payment failed?)
    if (order.status !== "PENDING" && order.payment_status !== 'FAILED') { // Allow cancelling if payment failed too
      return { error: "Can only cancel orders that are pending or failed payment." };
    }
    // Cannot cancel orders that have been paid and are processing/shipped etc.
    if (order.payment_status === 'COMPLETED' && order.status !== 'PENDING') {
        return { error: `Cannot cancel order with status ${order.status} after payment.` };
    }

    // --- Transaction Logic Start (Conceptual) --- 

    // 1. Update order status
    const { error: orderUpdateError } = await supabase
        .from('Order')
        .update({ status: "CANCELLED", payment_status: "CANCELLED" }) // Also mark payment as cancelled
        .eq('id', orderId);

    if (orderUpdateError) {
         console.error("Error cancelling order (order update):", orderUpdateError.message);
         throw new Error(`Failed to cancel order: ${orderUpdateError.message}`);
    }

    // 2. Update all order items status
    const { error: itemUpdateError } = await supabase
      .from('OrderItem')
      .update({ status: "CANCELLED" })
      .eq('order_id', orderId);

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

/**
 * Get all orders for the current user
 */
export async function getUserOrders(status?: string) {
  try {
    // Create the Supabase client for this specific action context
    const supabaseActionClient = await createSupabaseServerActionClient();
    
    // Get the user session using the Supabase client
    const { data: { user }, error: authError } = await supabaseActionClient.auth.getUser(); 
    
    if (authError || !user) {
      console.error("Authorization failed:", authError?.message || "User not found."); 
      return { error: "Unauthorized", orders: [] };
    }
    
    // Get customer profile
    const { data: customer, error: customerError } = await supabase
      .from('Customer')
      .select('id')
      .eq('user_id', user.id)
      .single();
      
    if (customerError || !customer) {
      console.error("Customer profile not found:", customerError?.message);
      return { error: "Customer profile not found", orders: [] };
    }
    
    // Build the query to fetch orders
    let query = supabase
      .from('Order')
      .select(`
        id, 
        status,
        total_amount,
        subtotal,
        tax_amount,
        shipping_amount,
        created_at,
        updated_at,
        pickup_code,
        agent_id,
        estimated_pickup_date,
        actual_pickup_date,
        payment_reference,
        OrderItem (
          id,
          quantity,
          price_at_purchase,
          Product (
            id,
            name,
            description,
            price,
            slug,
            vendor_id,
            ProductImage (
              url,
              alt_text,
              display_order
            ),
            Vendor (
              id,
              store_name
            )
          )
        )
      `)
      .eq('customer_id', customer.id)
      .order('created_at', { ascending: false });
      
    // Apply status filter if provided
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }
    
    // Execute the query
    const { data: orders, error: ordersError } = await query;
    
    if (ordersError) {
      console.error("Error fetching orders:", ordersError.message);
      return { error: ordersError.message, orders: [] };
    }
    
    // Transform the data structure to match what the UI expects
    const transformedOrders = orders.map((order: any) => {
      // Transform order items
      const items = order.OrderItem.map((item: any) => {
        // Get the first product image URL or use placeholder
        const productImageUrl = item.Product?.ProductImage && 
                               item.Product.ProductImage.length > 0 ?
                               item.Product.ProductImage[0].url : 
                               '/images/placeholder.jpg';
                               
        return {
          id: item.id,
          productId: item.Product?.id || '',
          productName: item.Product?.name || 'Unknown Product',
          productImage: productImageUrl,
          productSlug: item.Product?.slug || '',
          quantity: item.quantity,
          price: item.price_at_purchase,
          vendor: item.Product?.Vendor?.store_name || 'Unknown Vendor',
        };
      });
      
      // Generate an order number from the payment reference or ID
      const orderNumber = order.payment_reference ? 
                          order.payment_reference.substring(0, 8) : 
                          order.id.substring(0, 8);
      
      // Return transformed order
      return {
        id: order.id,
        orderNumber: orderNumber,
        status: order.status?.toLowerCase(),
        createdAt: order.created_at,
        updatedAt: order.updated_at,
        items,
        total: order.total_amount,
        subtotal: order.subtotal,
        tax: order.tax_amount,
        shippingFee: order.shipping_amount,
        pickupCode: order.pickup_code,
        expectedDeliveryDate: order.estimated_pickup_date,
        deliveredDate: order.actual_pickup_date,
        // Default return eligibility based on order status and date
        returnEligible: order.status === 'DELIVERED' && 
                       order.actual_pickup_date && 
                       (new Date().getTime() - new Date(order.actual_pickup_date).getTime()) < (24 * 60 * 60 * 1000),
        returnDeadline: order.actual_pickup_date ? 
                       new Date(new Date(order.actual_pickup_date).getTime() + (24 * 60 * 60 * 1000)).toISOString() :
                       undefined,
      };
    });
    
    return { orders: transformedOrders };
  } catch (error: any) {
    console.error("Error in getUserOrders:", error);
    return { error: error.message || "An unexpected error occurred", orders: [] };
  }
}

/**
 * Get a single order by ID
 */
export async function getOrderById(orderId: string) {
  try {
    // Create the Supabase client for this specific action context
    const supabaseActionClient = await createSupabaseServerActionClient();
    
    // Get the user session using the Supabase client
    const { data: { user }, error: authError } = await supabaseActionClient.auth.getUser(); 
    
    if (authError || !user) {
      console.error("Authorization failed:", authError?.message || "User not found."); 
      return { error: "Unauthorized" };
    }
    
    // Get customer profile
    const { data: customer, error: customerError } = await supabase
      .from('Customer')
      .select('id')
      .eq('user_id', user.id)
      .single();
      
    if (customerError) {
      console.error("Customer profile not found:", customerError?.message);
      return { error: "Customer profile not found" };
    }
    
    // Build the query to fetch the specific order
    const { data: order, error: orderError } = await supabase
      .from('Order')
      .select(`
        id, 
        status,
        total_amount,
        subtotal,
        tax_amount,
        shipping_amount,
        created_at,
        updated_at,
        pickup_code,
        agent_id,
        estimated_pickup_date,
        actual_pickup_date,
        customer_id,
        payment_reference,
        OrderItem (
          id,
          quantity,
          price_at_purchase,
          Product (
            id,
            name,
            description,
            price,
            slug,
            vendor_id,
            ProductImage (
              url,
              alt_text,
              display_order
            ),
            Vendor (
              id,
              store_name
            )
          )
        ),
        Agent (
          id,
          name,
          address_line1,
          city
        )
      `)
      .eq('id', orderId)
      .single();
      
    if (orderError) {
      console.error("Error fetching order:", orderError.message);
      return { error: orderError.message };
    }
    
    // Check if this order belongs to the user
    // Admins can view any order, regular users can only view their own
    const { data: userData } = await supabaseActionClient.from('User')
      .select('role')
      .eq('id', user.id)
      .single();
      
    const isAdmin = userData?.role === 'ADMIN';
    
    if (!isAdmin && order.customer_id !== customer?.id) {
      return { error: "You don't have permission to view this order" };
    }
    
    // Transform the data structure to match what the UI expects
    const items = order.OrderItem.map((item: any) => {
      // Get the first product image URL or use placeholder
      const productImageUrl = item.Product?.ProductImage && 
                             item.Product.ProductImage.length > 0 ?
                             item.Product.ProductImage[0].url : 
                             '/images/placeholder.jpg';
      
      return {
        id: item.id,
        productId: item.Product?.id || '',
        productName: item.Product?.name || 'Unknown Product',
        productImage: productImageUrl,
        productSlug: item.Product?.slug || '',
        quantity: item.quantity,
        price: item.price_at_purchase,
        vendor: item.Product?.Vendor?.store_name || 'Unknown Vendor',
      };
    });
    
    // Generate an order number from the payment reference or ID
    const orderNumber = order.payment_reference ? 
                        order.payment_reference.substring(0, 8) : 
                        order.id.substring(0, 8);
    
    // Generate tracking events based on order status and dates
    const trackingEvents = [
      {
        status: 'Order Placed',
        timestamp: order.created_at,
        description: 'Your order has been received and is being processed'
      },
      ...(order.status === 'PROCESSING' || order.status === 'SHIPPED' || order.status === 'DELIVERED' ? [{
        status: 'Processing',
        timestamp: order.updated_at || new Date(new Date(order.created_at).getTime() + 3600000).toISOString(),
        description: 'Your order is being prepared for dispatch'
      }] : []),
      ...(order.status === 'SHIPPED' || order.status === 'DELIVERED' ? [{
        status: 'Ready for Pickup',
        timestamp: order.estimated_pickup_date || new Date(new Date(order.created_at).getTime() + 86400000).toISOString(),
        description: 'Your order is ready for pickup at the agent location'
      }] : []),
      ...(order.status === 'DELIVERED' ? [{
        status: 'Delivered',
        timestamp: order.actual_pickup_date || new Date(new Date(order.created_at).getTime() + 172800000).toISOString(),
        description: 'Your order has been successfully delivered'
      }] : []),
    ];
    
    // Return transformed order
    const transformedOrder = {
      id: order.id,
      orderNumber: orderNumber,
      status: order.status?.toLowerCase(),
      createdAt: order.created_at,
      updatedAt: order.updated_at,
      items,
      total: order.total_amount,
      subtotal: order.subtotal,
      tax: order.tax_amount,
      shippingFee: order.shipping_amount,
      pickupCode: order.pickup_code,
      pickupLocation: order.Agent?.name || '',
      pickupAddress: order.Agent ? `${order.Agent.address_line1}, ${order.Agent.city}` : '',
      expectedDeliveryDate: order.estimated_pickup_date,
      deliveredDate: order.actual_pickup_date,
      // Default return eligibility based on order status and date
      returnEligible: order.status === 'DELIVERED' && 
                     order.actual_pickup_date && 
                     (new Date().getTime() - new Date(order.actual_pickup_date).getTime()) < (24 * 60 * 60 * 1000),
      returnDeadline: order.actual_pickup_date ? 
                     new Date(new Date(order.actual_pickup_date).getTime() + (24 * 60 * 60 * 1000)).toISOString() :
                     undefined,
      trackingEvents,
    };
    
    return { order: transformedOrder };
  } catch (error: any) {
    console.error("Error in getOrderById:", error);
    return { error: error.message || "An unexpected error occurred" };
  }
} 