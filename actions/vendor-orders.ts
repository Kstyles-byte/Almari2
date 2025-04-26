"use server";

import { auth } from "../auth";
import { db } from "../lib/db";
import { revalidatePath } from "next/cache";
import { getVendorByUserId } from "../lib/services/vendor";
import { createOrderStatusNotification } from "../lib/services/notification";

/**
 * Get all order items for a vendor
 */
export async function getVendorOrderItems() {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return { error: "Unauthorized" };
    }
    
    // Get vendor profile
    const vendor = await getVendorByUserId(session.user.id);
    
    if (!vendor) {
      return { error: "Vendor profile not found" };
    }
    
    // Get all order items for this vendor
    const orderItems = await db.orderItem.findMany({
      where: { vendorId: vendor.id },
      include: {
        product: true,
        order: {
          include: {
            customer: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    
    return { success: true, orderItems };
  } catch (error) {
    console.error("Error fetching vendor order items:", error);
    return { error: "Failed to fetch order items" };
  }
}

/**
 * Update order item status (for vendors)
 */
export async function updateOrderItemStatus(formData: FormData) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return { error: "Unauthorized" };
    }
    
    const orderItemId = formData.get("orderItemId") as string;
    const status = formData.get("status") as string;
    
    if (!orderItemId || !status) {
      return { error: "Order item ID and status are required" };
    }
    
    // Validate status
    const validStatuses = ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];
    if (!validStatuses.includes(status)) {
      return { error: "Invalid status" };
    }
    
    // Get vendor profile
    const vendor = await getVendorByUserId(session.user.id);
    
    if (!vendor) {
      return { error: "Vendor profile not found" };
    }
    
    // Get order item and check if it belongs to this vendor
    const orderItem = await db.orderItem.findUnique({
      where: { id: orderItemId },
      include: {
        order: true,
      },
    });
    
    if (!orderItem) {
      return { error: "Order item not found" };
    }
    
    if (orderItem.vendorId !== vendor.id) {
      return { error: "Not authorized to update this order item" };
    }
    
    // Update order item status
    await db.orderItem.update({
      where: { id: orderItemId },
      data: { status },
    });
    
    // Check if all order items are delivered or cancelled,
    // then update the order status accordingly
    if (status === "DELIVERED" || status === "CANCELLED") {
      const allOrderItems = await db.orderItem.findMany({
        where: { orderId: orderItem.orderId },
      });
      
      const allDeliveredOrCancelled = allOrderItems.every(
        (item: { status: string }) => item.status === "DELIVERED" || item.status === "CANCELLED"
      );
      
      if (allDeliveredOrCancelled) {
        // If all items are DELIVERED, order is DELIVERED
        // If all items are CANCELLED, order is CANCELLED
        // If mix of DELIVERED and CANCELLED, order is PARTIALLY_FULFILLED
        const allDelivered = allOrderItems.every((item: { status: string }) => item.status === "DELIVERED");
        const allCancelled = allOrderItems.every((item: { status: string }) => item.status === "CANCELLED");
        
        let orderStatus = "PARTIALLY_FULFILLED";
        if (allDelivered) orderStatus = "DELIVERED";
        if (allCancelled) orderStatus = "CANCELLED";
        
        await db.order.update({
          where: { id: orderItem.orderId },
          data: { status: orderStatus },
        });
        
        // Create notifications for order status change
        await createOrderStatusNotification(orderItem.orderId, orderStatus);
      }
    }
    
    // Create notifications for order item status change regardless of overall order status
    await createOrderStatusNotification(orderItem.orderId, status);
    
    revalidatePath("/vendor/orders");
    revalidatePath(`/vendor/orders/${orderItem.orderId}`);
    revalidatePath(`/customer/orders/${orderItem.orderId}`);
    
    return { success: true };
  } catch (error) {
    console.error("Error updating order item status:", error);
    return { error: "Failed to update order item status" };
  }
}

/**
 * Create a payout request
 */
export async function createPayoutRequest(formData: FormData) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return { error: "Unauthorized" };
    }
    
    const amount = formData.get("amount") as string;
    
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      return { error: "Valid amount is required" };
    }
    
    // Get vendor profile
    const vendor = await getVendorByUserId(session.user.id);
    
    if (!vendor) {
      return { error: "Vendor profile not found" };
    }
    
    // Create payout request
    await db.payout.create({
      data: {
        vendorId: vendor.id,
        amount: Number(amount),
        status: "PENDING",
      },
    });
    
    revalidatePath("/vendor/payouts");
    
    return { success: true };
  } catch (error) {
    console.error("Error creating payout request:", error);
    return { error: "Failed to create payout request" };
  }
} 