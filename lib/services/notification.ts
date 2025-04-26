import { db } from "../db";
import { Prisma } from "@prisma/client";

// Define NotificationType enum since it might not be defined in Prisma yet
type NotificationType = 
  | "ORDER_STATUS_CHANGE" 
  | "PICKUP_READY" 
  | "ORDER_PICKED_UP" 
  | "RETURN_REQUESTED" 
  | "RETURN_APPROVED" 
  | "RETURN_REJECTED" 
  | "REFUND_PROCESSED";

/**
 * Create a new notification
 */
export async function createNotification(data: {
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  orderId?: string;
  returnId?: string;
}) {
  try {
    const notification = await db.notification.create({
      data: {
        userId: data.userId,
        title: data.title,
        message: data.message,
        type: data.type as string,
        orderId: data.orderId,
        returnId: data.returnId,
      },
    });
    
    return { success: true, notification };
  } catch (error) {
    console.error("Error creating notification:", error);
    return { error: "Failed to create notification" };
  }
}

/**
 * Get user notifications with pagination
 */
export async function getUserNotifications(userId: string, options?: {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
}) {
  try {
    const page = options?.page || 1;
    const limit = options?.limit || 10;
    const skip = (page - 1) * limit;
    
    const where: any = { userId };
    
    if (options?.unreadOnly) {
      where.isRead = false;
    }
    
    const notifications = await db.notification.findMany({
      where,
      include: {
        order: true,
        return: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
    });
    
    const total = await db.notification.count({ where });
    
    return {
      data: notifications,
      meta: {
        total,
        page,
        limit,
        pageCount: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error("Error fetching user notifications:", error);
    return {
      data: [],
      meta: {
        total: 0,
        page: options?.page || 1,
        limit: options?.limit || 10,
        pageCount: 0,
      },
    };
  }
}

/**
 * Get unread notification count for a user
 */
export async function getUnreadNotificationCount(userId: string) {
  try {
    const count = await db.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });
    
    return { success: true, count };
  } catch (error) {
    console.error("Error getting unread notification count:", error);
    return { error: "Failed to get unread notification count" };
  }
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(notificationId: string) {
  try {
    const notification = await db.notification.update({
      where: { id: notificationId },
      data: {
        isRead: true,
      },
    });
    
    return { success: true, notification };
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return { error: "Failed to mark notification as read" };
  }
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsAsRead(userId: string) {
  try {
    await db.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });
    
    return { success: true };
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    return { error: "Failed to mark all notifications as read" };
  }
}

/**
 * Delete a notification
 */
export async function deleteNotification(notificationId: string) {
  try {
    await db.notification.delete({
      where: { id: notificationId },
    });
    
    return { success: true };
  } catch (error) {
    console.error("Error deleting notification:", error);
    return { error: "Failed to delete notification" };
  }
}

/**
 * Create order status change notification
 */
export async function createOrderStatusNotification(orderId: string, status: string) {
  try {
    // Get order with customer and vendor
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: {
        customer: {
          include: {
            user: true,
          },
        },
        items: {
          include: {
            vendor: true,
          },
        },
        agent: {
          include: {
            user: true,
          },
        },
      },
    });
    
    if (!order) {
      return { error: "Order not found" };
    }
    
    // Create notification for customer
    await createNotification({
      userId: order.customer.userId,
      title: "Order Status Updated",
      message: `Your order #${order.id} has been updated to ${status}`,
      type: "ORDER_STATUS_CHANGE",
      orderId,
    });
    
    // Create notifications for involved vendors
    // Define the type for order items
    interface OrderItem {
      vendor: {
        userId: string;
      };
    }
    
    // Use proper typing for the order.items structure
    const vendorIds = new Set<string>(order.items.map((item: OrderItem) => item.vendor.userId));
    
    for (const vendorId of vendorIds) {
      await createNotification({
        userId: vendorId,
        title: "Order Status Updated",
        message: `Order #${order.id} has been updated to ${status}`,
        type: "ORDER_STATUS_CHANGE",
        orderId,
      });
    }
    
    // Create notification for agent if assigned
    if (order.agent) {
      await createNotification({
        userId: order.agent.userId,
        title: "Order Status Updated",
        message: `Order #${order.id} has been updated to ${status}`,
        type: "ORDER_STATUS_CHANGE",
        orderId,
      });
    }
    
    return { success: true };
  } catch (error) {
    console.error("Error creating order status notification:", error);
    return { error: "Failed to create order status notification" };
  }
}

/**
 * Create pickup status change notification
 */
export async function createPickupStatusNotification(orderId: string, status: string) {
  try {
    // Get order with customer and agent
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: {
        customer: {
          include: {
            user: true,
          },
        },
        agent: {
          include: {
            user: true,
          },
        },
      },
    });
    
    if (!order) {
      return { error: "Order not found" };
    }
    
    if (!order.agent) {
      return { error: "Order has no assigned agent" };
    }
    
    if (status === "READY_FOR_PICKUP") {
      // Notify customer
      await createNotification({
        userId: order.customer.userId,
        title: "Order Ready for Pickup",
        message: `Your order #${order.id} is ready for pickup at ${order.agent.name} (${order.agent.location})`,
        type: "PICKUP_READY",
        orderId,
      });
    } else if (status === "PICKED_UP") {
      // Notify customer
      await createNotification({
        userId: order.customer.userId,
        title: "Order Picked Up",
        message: `Your order #${order.id} has been picked up`,
        type: "ORDER_PICKED_UP",
        orderId,
      });
      
      // Notify agent
      await createNotification({
        userId: order.agent.userId,
        title: "Order Picked Up",
        message: `Order #${order.id} has been picked up by the customer`,
        type: "ORDER_PICKED_UP",
        orderId,
      });
    }
    
    return { success: true };
  } catch (error) {
    console.error("Error creating pickup status notification:", error);
    return { error: "Failed to create pickup status notification" };
  }
}

/**
 * Create return status notification
 */
export async function createReturnStatusNotification(returnId: string, status: string) {
  try {
    // Get return with related entities
    const returnData = await db.return.findUnique({
      where: { id: returnId },
      include: {
        customer: {
          include: {
            user: true,
          },
        },
        vendor: {
          include: {
            user: true,
          },
        },
        agent: {
          include: {
            user: true,
          },
        },
        order: true,
        product: true,
      },
    });
    
    if (!returnData) {
      return { error: "Return not found" };
    }
    
    if (status === "REQUESTED") {
      // Notify vendor
      await createNotification({
        userId: returnData.vendor.userId,
        title: "Return Requested",
        message: `A return has been requested for product ${returnData.product.name} from order #${returnData.orderId}`,
        type: "RETURN_REQUESTED",
        returnId,
      });
      
      // Notify agent
      await createNotification({
        userId: returnData.agent.userId,
        title: "Return Requested",
        message: `A return has been requested for product ${returnData.product.name} from order #${returnData.orderId}`,
        type: "RETURN_REQUESTED",
        returnId,
      });
    } else if (status === "APPROVED") {
      // Notify customer
      await createNotification({
        userId: returnData.customer.userId,
        title: "Return Approved",
        message: `Your return request for product ${returnData.product.name} has been approved`,
        type: "RETURN_APPROVED",
        returnId,
      });
      
      // Notify agent
      await createNotification({
        userId: returnData.agent.userId,
        title: "Return Approved",
        message: `Return for product ${returnData.product.name} from order #${returnData.orderId} has been approved`,
        type: "RETURN_APPROVED",
        returnId,
      });
    } else if (status === "REJECTED") {
      // Notify customer
      await createNotification({
        userId: returnData.customer.userId,
        title: "Return Rejected",
        message: `Your return request for product ${returnData.product.name} has been rejected`,
        type: "RETURN_REJECTED",
        returnId,
      });
    } else if (status === "COMPLETED" || returnData.refundStatus === "PROCESSED") {
      // Notify customer
      await createNotification({
        userId: returnData.customer.userId,
        title: "Refund Processed",
        message: `Your refund for product ${returnData.product.name} has been processed`,
        type: "REFUND_PROCESSED",
        returnId,
      });
      
      // Notify vendor
      await createNotification({
        userId: returnData.vendor.userId,
        title: "Refund Processed",
        message: `Refund for product ${returnData.product.name} from order #${returnData.orderId} has been processed`,
        type: "REFUND_PROCESSED",
        returnId,
      });
    }
    
    return { success: true };
  } catch (error) {
    console.error("Error creating return status notification:", error);
    return { error: "Failed to create return status notification" };
  }
} 