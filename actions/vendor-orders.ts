"use server";

import { auth } from "../auth";
import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from "next/cache";
import { getVendorByUserId } from "../lib/services/vendor";
import { createOrderStatusNotification } from "../lib/services/notification";
import type { Vendor, OrderItem, Order, Payout } from "../types/supabase";

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error("Supabase URL/Key missing in vendor-order actions.");
}
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

// Define OrderItemStatus enum (adjust based on your actual Supabase enum type)
type OrderItemStatus = 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
// Define OrderStatus enum
type OrderStatus = 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'PAYMENT_FAILED' | 'PARTIALLY_FULFILLED';
// Define PayoutStatus enum
type PayoutStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

/**
 * Get all order items for a vendor
 */
export async function getVendorOrderItems(): Promise<{ success: boolean; orderItems?: OrderItem[]; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user) return { success: false, error: "Unauthorized" };

    // Get vendor profile (using migrated service)
    const vendor = await getVendorByUserId(session.user.id);
    if (!vendor) return { success: false, error: "Vendor profile not found" };

    // Get all order items for this vendor using Supabase
    const { data: orderItems, error } = await supabase
      .from('OrderItem') // Ensure table name matches
      .select(`
        *,
        Product:productId (*),
        Order:orderId (*, Customer:customerId (*))
      `)
      .eq('vendorId', vendor.id)
      .order('createdAt', { ascending: false });

    if (error) {
      console.error("Error fetching vendor order items:", error.message);
      throw new Error(`Failed to fetch order items: ${error.message}`);
    }

    return { success: true, orderItems: orderItems || [] };
  } catch (error) {
    console.error("Error in getVendorOrderItems action:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to fetch order items" };
  }
}

/**
 * Update order item status (for vendors)
 */
export async function updateOrderItemStatus(formData: FormData): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user) return { success: false, error: "Unauthorized" };

    const orderItemId = formData.get("orderItemId") as string;
    const status = formData.get("status") as OrderItemStatus;

    if (!orderItemId || !status) {
      return { success: false, error: "Order item ID and status are required" };
    }

    // Validate status
    const validStatuses: OrderItemStatus[] = ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];
    if (!validStatuses.includes(status)) {
      return { success: false, error: "Invalid status" };
    }

    // Get vendor profile
    const vendor = await getVendorByUserId(session.user.id);
    if (!vendor) return { success: false, error: "Vendor profile not found" };

    // Get order item and check if it belongs to this vendor
    const { data: orderItem, error: fetchError } = await supabase
        .from('OrderItem')
        .select('id, vendorId, orderId')
        .eq('id', orderItemId)
        .single();

    if (fetchError) {
        console.error("Error fetching order item:", fetchError.message);
        return { success: false, error: "Order item not found" };
    }
    if (!orderItem) return { success: false, error: "Order item not found (post-fetch)" };

    if (orderItem.vendorId !== vendor.id) {
      return { success: false, error: "Not authorized to update this order item" };
    }

    // --- Transaction Logic Start (Conceptual) --- 
    // Ideally use a DB function for atomicity

    // 1. Update order item status
    const { error: itemUpdateError } = await supabase
      .from('OrderItem')
      .update({ status: status, updatedAt: new Date().toISOString() })
      .eq('id', orderItemId);

    if (itemUpdateError) {
        console.error("Error updating order item status:", itemUpdateError.message);
        throw new Error(`Failed to update order item: ${itemUpdateError.message}`);
    }

    // 2. Check if all order items for the parent order have a final status,
    //    and update the parent Order status accordingly.
    if (status === "DELIVERED" || status === "CANCELLED") {
        const { data: allOrderItems, error: allItemsError } = await supabase
            .from('OrderItem')
            .select('status')
            .eq('orderId', orderItem.orderId);

        if (allItemsError || !allOrderItems) {
            console.error("Error fetching all order items for status check:", allItemsError?.message);
            // Log error but proceed with notification for the item itself
        } else {
            const allStatuses = allOrderItems.map(item => item.status as OrderItemStatus);
            const allDeliveredOrCancelled = allStatuses.every(
                itemStatus => itemStatus === "DELIVERED" || itemStatus === "CANCELLED"
            );

            if (allDeliveredOrCancelled) {
                const allDelivered = allStatuses.every(itemStatus => itemStatus === "DELIVERED");
                const allCancelled = allStatuses.every(itemStatus => itemStatus === "CANCELLED");

                let finalOrderStatus: OrderStatus = "PARTIALLY_FULFILLED";
                if (allDelivered) finalOrderStatus = "DELIVERED";
                if (allCancelled) finalOrderStatus = "CANCELLED";

                // Update the parent Order status
                const { error: orderUpdateError } = await supabase
                    .from('Order')
                    .update({ status: finalOrderStatus, updatedAt: new Date().toISOString() })
                    .eq('id', orderItem.orderId);
                
                if (orderUpdateError) {
                     console.error("Error updating parent order status:", orderUpdateError.message);
                     // Log error, but don't necessarily fail the whole action
                } else {
                    // Create notification for *final* order status change if update was successful
                    await createOrderStatusNotification(orderItem.orderId, finalOrderStatus);
                }
            }
        }
    }

    // --- Transaction Logic End --- 

    // Create notification for the specific item status change (might be redundant if final order status also changed)
    // Consider sending only the final order status notification if applicable?
    // await createOrderStatusNotification(orderItem.orderId, `ITEM_${status}`); // Example: Use a specific notification type?

    revalidatePath("/vendor/orders");
    revalidatePath(`/vendor/orders/${orderItem.orderId}`);
    revalidatePath(`/customer/orders/${orderItem.orderId}`);

    return { success: true };
  } catch (error) {
    console.error("Error updating order item status action:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to update order item status" };
  }
}

/**
 * Create a payout request
 */
export async function createPayoutRequest(formData: FormData): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user) return { success: false, error: "Unauthorized" };

    const amountStr = formData.get("amount") as string;
    const amount = Number(amountStr);

    if (!amountStr || isNaN(amount) || amount <= 0) {
      return { success: false, error: "Valid positive amount is required" };
    }

    // Get vendor profile
    const vendor = await getVendorByUserId(session.user.id);
    if (!vendor) return { success: false, error: "Vendor profile not found" };

    // TODO: Add logic to check if vendor's available balance is sufficient for the payout amount.
    // This would require calculating completed/paid order item totals minus previous payouts.

    // Create payout request using Supabase
    const { error } = await supabase
      .from('Payout') // Ensure table name matches
      .insert({
        vendorId: vendor.id,
        amount: amount,
        status: "PENDING" as PayoutStatus, // Cast status to type
        // createdAt/updatedAt handled by DB
      });

    if (error) {
        console.error("Error creating payout request:", error.message);
        throw new Error(`Failed to create payout request: ${error.message}`);
    }

    revalidatePath("/vendor/payouts");

    return { success: true };
  } catch (error) {
    console.error("Error in createPayoutRequest action:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to create payout request" };
  }
} 