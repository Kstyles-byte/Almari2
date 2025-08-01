"use server";

import { auth } from "../auth";
import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from "next/cache";
import { getVendorByUserId } from "../lib/services/vendor";
import { createOrderStatusNotification } from "../lib/services/notification";
import type { Tables } from "../types/supabase";
import { createServerActionClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

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
export async function getVendorOrderItems(): Promise<{ success: boolean; orderItems?: Tables<'OrderItem'>[]; error?: string }> {
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
 * Create a payout request
 */
export async function createPayoutRequest(formData: FormData): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user) return { success: false, error: "Unauthorized" };

    const amountStr = formData.get("amount") as string;
    const amount = Number(amountStr);
    const accountName = formData.get("accountName") as string;
    const accountNumber = formData.get("accountNumber") as string;
    const bankName = formData.get("bankName") as string;

    if (!amountStr || isNaN(amount) || amount <= 0) {
      return { success: false, error: "Valid positive amount is required" };
    }

    if (!accountName || !accountNumber || !bankName) {
      return { success: false, error: "Bank details are required" };
    }

    // Get vendor profile
    const vendor = await getVendorByUserId(session.user.id);
    if (!vendor) return { success: false, error: "Vendor profile not found" };

    // Check if vendor's available balance is sufficient
    // First get completed order totals
    const { data: completedOrderItems } = await supabase
      .from('OrderItem')
      .select('price_at_purchase, quantity, commission_amount')
      .eq('vendor_id', vendor.id)
      .eq('status', 'DELIVERED');

    let totalEarnings = 0;
    let totalCommission = 0;

    if (completedOrderItems) {
      completedOrderItems.forEach(item => {
        const itemTotal = item.price_at_purchase * item.quantity;
        totalEarnings += itemTotal;
        totalCommission += item.commission_amount || (itemTotal * 0.05);
      });
    }

    // Get previous payouts
    const { data: previousPayouts } = await supabase
      .from('Payout')
      .select('amount')
      .eq('vendor_id', vendor.id)
      .in('status', ['COMPLETED', 'PENDING']);

    const totalPaidOut = previousPayouts
      ? previousPayouts.reduce((sum, payout) => sum + payout.amount, 0)
      : 0;

    const netEarnings = totalEarnings - totalCommission;
    const availableBalance = netEarnings - totalPaidOut;

    if (amount > availableBalance) {
      return { success: false, error: "Insufficient available balance" };
    }

    // Create payout request with bank details
    const { error } = await supabase
      .from('Payout')
      .insert({
        vendor_id: vendor.id,
        amount: amount,
        request_amount: amount,
        status: "PENDING" as PayoutStatus,
        bank_details: {
          accountName,
          accountNumber,
          bankName
        }
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

/**
 * Updates the status of a specific order item
 */
export async function updateOrderItemStatus(orderItemId: string, newStatus: string) {
  const allowedStatuses = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
  
  if (!allowedStatuses.includes(newStatus)) {
    return { 
      error: 'Invalid status provided', 
      success: false 
    };
  }

  try {
    const cookieStore = cookies();
    const supabase = createServerActionClient({ cookies: () => cookieStore });

    // First get the current user and fetch their vendor ID
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { error: 'Unauthorized', success: false };
    }

    // Get vendor ID
    const { data: vendorData, error: vendorError } = await supabase
      .from('Vendor')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (vendorError || !vendorData) {
      return { error: 'Vendor not found', success: false };
    }

    // Verify order item belongs to this vendor
    const { data: orderItem, error: orderItemError } = await supabase
      .from('OrderItem')
      .select('id, order_id')
      .eq('id', orderItemId)
      .eq('vendor_id', vendorData.id)
      .single();

    if (orderItemError || !orderItem) {
      return { 
        error: 'Order item not found or you do not have permission to update it', 
        success: false 
      };
    }

    // Update the order item status
    const { error: updateError } = await supabase
      .from('OrderItem')
      .update({ 
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderItemId);

    if (updateError) {
      return { 
        error: `Error updating order status: ${updateError.message}`, 
        success: false 
      };
    }

    // Revalidate the order pages
    revalidatePath('/vendor/orders');
    revalidatePath(`/vendor/orders/${orderItem.order_id}`);
    
    return { 
      success: true,
      newStatus
    };
  } catch (error) {
    console.error('Error in updateOrderItemStatus:', error);
    return { 
      error: error instanceof Error ? error.message : 'An unknown error occurred', 
      success: false 
    };
  }
}

/**
 * Updates the status of all items in an order for this vendor
 */
export async function updateAllVendorOrderItems(orderId: string, newStatus: string) {
  const allowedStatuses = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
  
  if (!allowedStatuses.includes(newStatus)) {
    return { 
      error: 'Invalid status provided', 
      success: false 
    };
  }

  try {
    const cookieStore = cookies();
    const supabase = createServerActionClient({ cookies: () => cookieStore });

    // First get the current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { error: 'Unauthorized', success: false };
    }

    // Get vendor ID
    const { data: vendorData, error: vendorError } = await supabase
      .from('Vendor')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (vendorError || !vendorData) {
      return { error: 'Vendor not found', success: false };
    }

    // Update all order items for this vendor in this order
    const { error: updateError, count } = await supabase
      .from('OrderItem')
      .update({ 
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('order_id', orderId)
      .eq('vendor_id', vendorData.id);

    if (updateError) {
      return { 
        error: `Error updating order items: ${updateError.message}`, 
        success: false 
      };
    }

    // Revalidate the order pages
    revalidatePath('/vendor/orders');
    revalidatePath(`/vendor/orders/${orderId}`);
    
    return { 
      success: true,
      updatedCount: count,
      newStatus
    };
  } catch (error) {
    console.error('Error in updateAllVendorOrderItems:', error);
    return { 
      error: error instanceof Error ? error.message : 'An unknown error occurred', 
      success: false 
    };
  }
} 