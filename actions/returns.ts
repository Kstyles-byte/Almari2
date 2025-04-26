"use server";

import { auth } from "../auth";
import { db } from "../lib/db";
import { revalidatePath } from "next/cache";
import { getCustomerByUserId } from "../lib/services/customer";
import { getVendorByUserId } from "../lib/services/vendor";
import { getAgentByUserId } from "../lib/services/agent";
import { 
  createReturnRequest,
  getReturnById,
  getCustomerReturns,
  getVendorReturns,
  getAgentReturns,
  approveReturnRequest,
  rejectReturnRequest,
  completeReturnProcess,
  processRefund
} from "../lib/services/return";
import { createReturnStatusNotification } from "../lib/services/notification";

/**
 * Create a new return request
 */
export async function createReturnRequestAction(formData: FormData) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return { error: "Unauthorized" };
    }
    
    // Get customer profile
    const customer = await getCustomerByUserId(session.user.id);
    
    if (!customer) {
      return { error: "Customer profile not found" };
    }
    
    const orderId = formData.get("orderId") as string;
    const productId = formData.get("productId") as string;
    const vendorId = formData.get("vendorId") as string;
    const agentId = formData.get("agentId") as string;
    const reason = formData.get("reason") as string;
    const refundAmount = parseFloat(formData.get("refundAmount") as string);
    
    if (!orderId || !productId || !vendorId || !agentId || !reason || isNaN(refundAmount)) {
      return { error: "Missing required fields" };
    }
    
    // Create return request
    const result = await createReturnRequest({
      orderId,
      productId,
      customerId: customer.id,
      vendorId,
      agentId,
      reason,
      refundAmount,
    });
    
    if (result.error) {
      return { error: result.error };
    }
    
    // Create notification for return request
    if (result.returnRequest) {
      await createReturnStatusNotification(result.returnRequest.id, "REQUESTED");
    }
    
    revalidatePath(`/customer/orders/${orderId}`);
    revalidatePath("/customer/returns");
    
    return result;
  } catch (error) {
    console.error("Error creating return request:", error);
    return { error: "Failed to create return request" };
  }
}

/**
 * Get return by ID
 */
export async function getReturnByIdAction(returnId: string) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return { error: "Unauthorized" };
    }
    
    // Get return
    const returnData = await getReturnById(returnId);
    
    if (!returnData) {
      return { error: "Return not found" };
    }
    
    // Check authorization based on role
    if (session.user.role === "CUSTOMER") {
      const customer = await getCustomerByUserId(session.user.id);
      if (!customer || customer.id !== returnData.customerId) {
        return { error: "Unauthorized" };
      }
    } else if (session.user.role === "VENDOR") {
      const vendor = await getVendorByUserId(session.user.id);
      if (!vendor || vendor.id !== returnData.vendorId) {
        return { error: "Unauthorized" };
      }
    } else if (session.user.role === "AGENT") {
      const agent = await getAgentByUserId(session.user.id);
      if (!agent || agent.id !== returnData.agentId) {
        return { error: "Unauthorized" };
      }
    } else if (session.user.role !== "ADMIN") {
      return { error: "Unauthorized" };
    }
    
    return { success: true, return: returnData };
  } catch (error) {
    console.error("Error fetching return by ID:", error);
    return { error: "Failed to fetch return" };
  }
}

/**
 * Get customer returns
 */
export async function getCustomerReturnsAction(options?: {
  page?: number;
  limit?: number;
  status?: string;
}) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return { error: "Unauthorized" };
    }
    
    // Get customer profile
    const customer = await getCustomerByUserId(session.user.id);
    
    if (!customer) {
      return { error: "Customer profile not found" };
    }
    
    // Get customer returns
    const returns = await getCustomerReturns(customer.id, options);
    
    return { success: true, ...returns };
  } catch (error) {
    console.error("Error fetching customer returns:", error);
    return { error: "Failed to fetch returns" };
  }
}

/**
 * Get vendor returns
 */
export async function getVendorReturnsAction(options?: {
  page?: number;
  limit?: number;
  status?: string;
}) {
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
    
    // Get vendor returns
    const returns = await getVendorReturns(vendor.id, options);
    
    return { success: true, ...returns };
  } catch (error) {
    console.error("Error fetching vendor returns:", error);
    return { error: "Failed to fetch returns" };
  }
}

/**
 * Get agent returns
 */
export async function getAgentReturnsAction(options?: {
  page?: number;
  limit?: number;
  status?: string;
}) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return { error: "Unauthorized" };
    }
    
    // Get agent profile
    const agent = await getAgentByUserId(session.user.id);
    
    if (!agent) {
      return { error: "Agent profile not found" };
    }
    
    // Get agent returns
    const returns = await getAgentReturns(agent.id, options);
    
    return { success: true, ...returns };
  } catch (error) {
    console.error("Error fetching agent returns:", error);
    return { error: "Failed to fetch returns" };
  }
}

/**
 * Approve return request (vendor action)
 */
export async function approveReturnRequestAction(formData: FormData) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return { error: "Unauthorized" };
    }
    
    const returnId = formData.get("returnId") as string;
    
    if (!returnId) {
      return { error: "Return ID is required" };
    }
    
    // Get return
    const returnData = await getReturnById(returnId);
    
    if (!returnData) {
      return { error: "Return not found" };
    }
    
    // Check authorization
    if (session.user.role === "VENDOR") {
      const vendor = await getVendorByUserId(session.user.id);
      if (!vendor || vendor.id !== returnData.vendorId) {
        return { error: "Unauthorized" };
      }
    } else if (session.user.role !== "ADMIN") {
      return { error: "Unauthorized" };
    }
    
    // Approve return
    const result = await approveReturnRequest(returnId);
    
    if (result.error) {
      return { error: result.error };
    }
    
    // Create notification for approved return
    await createReturnStatusNotification(returnId, "APPROVED");
    
    revalidatePath(`/vendor/returns/${returnId}`);
    revalidatePath("/vendor/returns");
    revalidatePath(`/customer/returns/${returnId}`);
    revalidatePath("/customer/returns");
    
    return { success: true, return: result.return };
  } catch (error) {
    console.error("Error approving return request:", error);
    return { error: "Failed to approve return request" };
  }
}

/**
 * Reject return request (vendor action)
 */
export async function rejectReturnRequestAction(formData: FormData) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return { error: "Unauthorized" };
    }
    
    const returnId = formData.get("returnId") as string;
    const reason = formData.get("reason") as string;
    
    if (!returnId || !reason) {
      return { error: "Return ID and reason are required" };
    }
    
    // Get return
    const returnData = await getReturnById(returnId);
    
    if (!returnData) {
      return { error: "Return not found" };
    }
    
    // Check authorization
    if (session.user.role === "VENDOR") {
      const vendor = await getVendorByUserId(session.user.id);
      if (!vendor || vendor.id !== returnData.vendorId) {
        return { error: "Unauthorized" };
      }
    } else if (session.user.role !== "ADMIN") {
      return { error: "Unauthorized" };
    }
    
    // Reject return
    const result = await rejectReturnRequest(returnId, reason);
    
    if (result.error) {
      return { error: result.error };
    }
    
    // Create notification for rejected return
    await createReturnStatusNotification(returnId, "REJECTED");
    
    revalidatePath(`/vendor/returns/${returnId}`);
    revalidatePath("/vendor/returns");
    revalidatePath(`/customer/returns/${returnId}`);
    revalidatePath("/customer/returns");
    
    return { success: true, return: result.return };
  } catch (error) {
    console.error("Error rejecting return request:", error);
    return { error: "Failed to reject return request" };
  }
}

/**
 * Complete return process
 */
export async function completeReturnProcessAction(formData: FormData) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return { error: "Unauthorized" };
    }
    
    const returnId = formData.get("returnId") as string;
    
    if (!returnId) {
      return { error: "Return ID is required" };
    }
    
    // Complete return process
    const result = await completeReturnProcess(returnId);
    
    if (result.error) {
      return { error: result.error };
    }
    
    // Create notification for completed return and processed refund
    await createReturnStatusNotification(returnId, "COMPLETED");
    
    revalidatePath(`/agent/returns/${returnId}`);
    revalidatePath("/agent/returns");
    revalidatePath("/customer/returns");
    
    return result;
  } catch (error) {
    console.error("Error completing return process:", error);
    return { error: "Failed to complete return process" };
  }
}

/**
 * Admin: Get all returns
 */
export async function getAllReturnsAction(options?: {
  page?: number;
  limit?: number;
  status?: string;
}) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return { error: "Unauthorized" };
    }
    
    // Only admins can list all returns
    if (session.user.role !== "ADMIN") {
      return { error: "Unauthorized" };
    }
    
    const page = options?.page || 1;
    const limit = options?.limit || 10;
    const skip = (page - 1) * limit;
    
    const where: any = {};
    
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
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
    });
    
    const total = await db.return.count({ where });
    
    return {
      success: true,
      data: returns,
      meta: {
        total,
        page,
        limit,
        pageCount: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error("Error fetching all returns:", error);
    return { error: "Failed to fetch returns" };
  }
}