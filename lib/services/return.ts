import { db } from "../db";
import { processAutomatedRefund } from "./refund";

/**
 * Create a new return request
 */
export async function createReturnRequest(data: {
  orderId: string;
  productId: string;
  customerId: string;
  vendorId: string;
  agentId: string;
  reason: string;
  refundAmount: number;
}) {
  try {
    // Verify that the order was picked up within the last 24 hours
    const order = await db.order.findUnique({
      where: { id: data.orderId },
    });
    
    if (!order) {
      return { error: "Order not found" };
    }
    
    if (order.pickupStatus !== "PICKED_UP") {
      return { error: "Order has not been picked up yet" };
    }
    
    if (!order.pickupDate) {
      return { error: "Pickup date not recorded" };
    }
    
    const pickupDate = new Date(order.pickupDate);
    const currentDate = new Date();
    const hoursSincePickup = (currentDate.getTime() - pickupDate.getTime()) / (1000 * 60 * 60);
    
    if (hoursSincePickup > 24) {
      return { error: "Return request must be made within 24 hours of pickup" };
    }
    
    // Create return request
    const returnRequest = await db.return.create({
      data: {
        orderId: data.orderId,
        productId: data.productId,
        customerId: data.customerId,
        vendorId: data.vendorId,
        agentId: data.agentId,
        reason: data.reason,
        refundAmount: data.refundAmount,
        status: "REQUESTED",
        refundStatus: "PENDING",
      },
    });
    
    return { success: true, returnRequest };
  } catch (error) {
    console.error("Error creating return request:", error);
    return { error: "Failed to create return request" };
  }
}

/**
 * Get return by ID
 */
export async function getReturnById(returnId: string) {
  try {
    const returnData = await db.return.findUnique({
      where: { id: returnId },
      include: {
        order: true,
        product: true,
        customer: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
        vendor: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
        agent: true,
      },
    });
    
    return returnData;
  } catch (error) {
    console.error("Error fetching return by ID:", error);
    return null;
  }
}

/**
 * Get returns by customer
 */
export async function getCustomerReturns(customerId: string, options?: {
  page?: number;
  limit?: number;
  status?: string;
}) {
  try {
    const page = options?.page || 1;
    const limit = options?.limit || 10;
    const skip = (page - 1) * limit;
    
    const where: any = { customerId };
    
    if (options?.status) {
      where.status = options.status;
    }
    
    const returns = await db.return.findMany({
      where,
      include: {
        order: true,
        product: true,
        vendor: {
          select: {
            id: true,
            storeName: true,
          },
        },
        agent: {
          select: {
            id: true,
            name: true,
            location: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
    });
    
    const total = await db.return.count({ where });
    
    return {
      data: returns,
      meta: {
        total,
        page,
        limit,
        pageCount: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error("Error fetching customer returns:", error);
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
 * Get returns by vendor
 */
export async function getVendorReturns(vendorId: string, options?: {
  page?: number;
  limit?: number;
  status?: string;
}) {
  try {
    const page = options?.page || 1;
    const limit = options?.limit || 10;
    const skip = (page - 1) * limit;
    
    const where: any = { vendorId };
    
    if (options?.status) {
      where.status = options.status;
    }
    
    const returns = await db.return.findMany({
      where,
      include: {
        order: true,
        product: true,
        customer: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
        agent: {
          select: {
            id: true,
            name: true,
            location: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
    });
    
    const total = await db.return.count({ where });
    
    return {
      data: returns,
      meta: {
        total,
        page,
        limit,
        pageCount: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error("Error fetching vendor returns:", error);
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
 * Get returns by agent
 */
export async function getAgentReturns(agentId: string, options?: {
  page?: number;
  limit?: number;
  status?: string;
}) {
  try {
    const page = options?.page || 1;
    const limit = options?.limit || 10;
    const skip = (page - 1) * limit;
    
    const where: any = { agentId };
    
    if (options?.status) {
      where.status = options.status;
    }
    
    const returns = await db.return.findMany({
      where,
      include: {
        order: true,
        product: true,
        customer: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
        vendor: {
          select: {
            id: true,
            storeName: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
    });
    
    const total = await db.return.count({ where });
    
    return {
      data: returns,
      meta: {
        total,
        page,
        limit,
        pageCount: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error("Error fetching agent returns:", error);
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
 * Approve return request
 */
export async function approveReturnRequest(returnId: string) {
  try {
    const returnData = await db.return.update({
      where: { id: returnId },
      data: {
        status: "APPROVED",
        processDate: new Date(),
      },
    });
    
    return { success: true, return: returnData };
  } catch (error) {
    console.error("Error approving return request:", error);
    return { error: "Failed to approve return request" };
  }
}

/**
 * Reject return request
 */
export async function rejectReturnRequest(returnId: string, reason: string) {
  try {
    const returnData = await db.return.update({
      where: { id: returnId },
      data: {
        status: "REJECTED",
        refundStatus: "REJECTED",
        reason: `REJECTED: ${reason}`,
        processDate: new Date(),
      },
    });
    
    return { success: true, return: returnData };
  } catch (error) {
    console.error("Error rejecting return request:", error);
    return { error: "Failed to reject return request" };
  }
}

/**
 * Complete return process
 */
export async function completeReturnProcess(returnId: string) {
  try {
    // Get return data
    const returnData = await db.return.findUnique({
      where: { id: returnId },
      include: {
        product: true,
      },
    });
    
    if (!returnData) {
      return { error: "Return not found" };
    }
    
    if (returnData.status !== "APPROVED") {
      return { error: "Return must be approved before completing" };
    }
    
    // Update product inventory (increase by 1)
    await db.product.update({
      where: { id: returnData.productId },
      data: {
        inventory: { increment: 1 },
      },
    });
    
    // Update return status
    const updatedReturn = await db.return.update({
      where: { id: returnId },
      data: {
        status: "COMPLETED",
      },
    });
    
    // Process automated refund through Paystack
    const refundResult = await processAutomatedRefund(returnId);
    
    if (refundResult.error) {
      console.error("Error processing refund:", refundResult.error);
      // We still mark the return as completed even if the refund fails
      // The refund can be retried separately
    }
    
    return { success: true, return: updatedReturn };
  } catch (error) {
    console.error("Error completing return process:", error);
    return { error: "Failed to complete return process" };
  }
}

/**
 * Process refund
 */
export async function processRefund(returnId: string) {
  try {
    // Use the new automated refund system
    const refundResult = await processAutomatedRefund(returnId);
    
    if (refundResult.error) {
      return { error: refundResult.error };
    }
    
    return { 
      success: true, 
      return: refundResult.refundData,
      message: refundResult.message
    };
  } catch (error) {
    console.error("Error processing refund:", error);
    return { error: "Failed to process refund" };
  }
} 