"use server";

import { auth } from "../auth";
import { db } from "../lib/db";
import { revalidatePath } from "next/cache";
import { 
  createAgent,
  getAgentByUserId,
  getAgentById,
  updateAgent,
  deleteAgent,
  getAgentOrders,
  getAgentPendingPickups,
  updateOrderPickupStatus,
  verifyPickupCode,
  generatePickupCode
} from "../lib/services/agent";
import { createPickupStatusNotification } from "../lib/services/notification";

/**
 * Create a new agent
 */
export async function createAgentAction(formData: FormData) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return { error: "Unauthorized" };
    }
    
    // Only admins can create agents
    if (session.user.role !== "ADMIN") {
      return { error: "Only admins can create agents" };
    }
    
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;
    const location = formData.get("location") as string;
    const operatingHours = formData.get("operatingHours") as string;
    const capacity = parseInt(formData.get("capacity") as string) || 0;
    const userId = formData.get("userId") as string;
    
    // Validate required fields
    if (!name || !email || !phone || !location || !userId) {
      return { error: "All fields are required" };
    }
    
    // Create agent
    const result = await createAgent({
      userId,
      name,
      email,
      phone,
      location,
      operatingHours,
      capacity,
    });
    
    if (result.error) {
      return { error: result.error };
    }
    
    // Update user role to AGENT
    await db.user.update({
      where: { id: userId },
      data: { role: "AGENT" },
    });
    
    revalidatePath("/admin/agents");
    
    return { success: true, agent: result.agent };
  } catch (error) {
    console.error("Error creating agent:", error);
    return { error: "Failed to create agent" };
  }
}

/**
 * Get current agent profile
 */
export async function getCurrentAgentProfile() {
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
    
    return { success: true, agent };
  } catch (error) {
    console.error("Error fetching agent profile:", error);
    return { error: "Failed to fetch agent profile" };
  }
}

/**
 * Update agent profile
 */
export async function updateAgentProfile(formData: FormData) {
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
    
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;
    const location = formData.get("location") as string;
    const operatingHours = formData.get("operatingHours") as string;
    const capacity = parseInt(formData.get("capacity") as string) || 0;
    
    // Validate required fields
    if (!name || !email || !phone || !location) {
      return { error: "Name, email, phone, and location are required" };
    }
    
    // Update agent
    const result = await updateAgent(agent.id, {
      name,
      email,
      phone,
      location,
      operatingHours,
      capacity,
    });
    
    if (result.error) {
      return { error: result.error };
    }
    
    revalidatePath("/agent/profile");
    
    return { success: true, agent: result.agent };
  } catch (error) {
    console.error("Error updating agent profile:", error);
    return { error: "Failed to update agent profile" };
  }
}

/**
 * Get agent orders
 */
export async function getAgentOrdersAction(options?: {
  page?: number;
  limit?: number;
  status?: string;
  pickupStatus?: string;
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
    
    // Get agent orders
    const orders = await getAgentOrders(agent.id, options);
    
    return { success: true, ...orders };
  } catch (error) {
    console.error("Error fetching agent orders:", error);
    return { error: "Failed to fetch agent orders" };
  }
}

/**
 * Get agent pending pickups
 */
export async function getAgentPendingPickupsAction(options?: {
  page?: number;
  limit?: number;
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
    
    // Get agent pending pickups
    const pickups = await getAgentPendingPickups(agent.id, options);
    
    return { success: true, ...pickups };
  } catch (error) {
    console.error("Error fetching agent pending pickups:", error);
    return { error: "Failed to fetch agent pending pickups" };
  }
}

/**
 * Mark an order as ready for pickup
 */
export async function markOrderReadyForPickup(formData: FormData) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return { error: "Unauthorized" };
    }
    
    const orderId = formData.get("orderId") as string;
    
    if (!orderId) {
      return { error: "Order ID is required" };
    }
    
    // Get agent profile
    const agent = await getAgentByUserId(session.user.id);
    
    if (!agent) {
      return { error: "Agent profile not found" };
    }
    
    // Get the order
    const order = await db.order.findUnique({
      where: { id: orderId },
    });
    
    if (!order) {
      return { error: "Order not found" };
    }
    
    // Check if the agent is assigned to this order
    if (order.agentId !== agent.id) {
      return { error: "This order is not assigned to you" };
    }
    
    // Check if order is in correct status
    if (order.status !== "PROCESSING" && order.status !== "SHIPPED") {
      return { error: "Order must be processing or shipped to mark as ready for pickup" };
    }
    
    // Generate pickup code
    const pickupCode = generatePickupCode();
    
    // Update order status
    await db.order.update({
      where: { id: orderId },
      data: {
        pickupStatus: "READY_FOR_PICKUP",
        pickupCode,
      },
    });
    
    // Create notification for pickup status change
    await createPickupStatusNotification(orderId, "READY_FOR_PICKUP");
    
    revalidatePath(`/agent/orders/${orderId}`);
    revalidatePath("/agent/orders");
    revalidatePath("/agent/pickups");
    
    return { success: true, pickupCode };
  } catch (error) {
    console.error("Error marking order ready for pickup:", error);
    return { error: "Failed to mark order as ready for pickup" };
  }
}

/**
 * Verify customer pickup
 */
export async function verifyCustomerPickup(formData: FormData) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return { error: "Unauthorized" };
    }
    
    const orderId = formData.get("orderId") as string;
    const pickupCode = formData.get("pickupCode") as string;
    
    if (!orderId || !pickupCode) {
      return { error: "Order ID and pickup code are required" };
    }
    
    // Get agent profile
    const agent = await getAgentByUserId(session.user.id);
    
    if (!agent) {
      return { error: "Agent profile not found" };
    }
    
    // Get the order
    const order = await db.order.findUnique({
      where: { id: orderId },
    });
    
    if (!order) {
      return { error: "Order not found" };
    }
    
    // Check if the agent is assigned to this order
    if (order.agentId !== agent.id) {
      return { error: "This order is not assigned to you" };
    }
    
    // Verify pickup code
    const verificationResult = await verifyPickupCode(orderId, pickupCode);
    
    if (!verificationResult.success) {
      return { error: verificationResult.error };
    }
    
    // Update order status to DELIVERED when picked up
    await db.order.update({
      where: { id: orderId },
      data: {
        status: "DELIVERED",
      },
    });
    
    // Update all order items to DELIVERED
    await db.orderItem.updateMany({
      where: { orderId },
      data: {
        status: "DELIVERED",
      },
    });
    
    // Create notification for pickup status change
    await createPickupStatusNotification(orderId, "PICKED_UP");
    
    revalidatePath(`/agent/orders/${orderId}`);
    revalidatePath("/agent/orders");
    revalidatePath("/agent/pickups");
    
    return { success: true };
  } catch (error) {
    console.error("Error verifying customer pickup:", error);
    return { error: "Failed to verify pickup" };
  }
}

/**
 * Admin: Get all agents
 */
export async function getAllAgentsAction(options?: {
  page?: number;
  limit?: number;
  isActive?: boolean;
}) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return { error: "Unauthorized" };
    }
    
    // Only admins can list all agents
    if (session.user.role !== "ADMIN") {
      return { error: "Unauthorized" };
    }
    
    const page = options?.page || 1;
    const limit = options?.limit || 10;
    const isActive = options?.isActive;
    
    const where = isActive !== undefined ? { isActive } : {};
    
    const agents = await db.agent.findMany({
      where,
      take: limit,
      skip: (page - 1) * limit,
      orderBy: {
        createdAt: "desc",
      },
    });
    
    const total = await db.agent.count({ where });
    
    return {
      success: true,
      data: agents,
      meta: {
        total,
        page,
        limit,
        pageCount: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error("Error fetching all agents:", error);
    return { error: "Failed to fetch agents" };
  }
}

/**
 * Admin: Update agent status
 */
export async function updateAgentStatusAction(formData: FormData) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return { error: "Unauthorized" };
    }
    
    // Only admins can update agent status
    if (session.user.role !== "ADMIN") {
      return { error: "Unauthorized" };
    }
    
    const agentId = formData.get("agentId") as string;
    const isActiveStr = formData.get("isActive") as string;
    const isActive = isActiveStr === "true";
    
    if (!agentId) {
      return { error: "Agent ID is required" };
    }
    
    // Update agent
    const result = await updateAgent(agentId, { isActive });
    
    if (result.error) {
      return { error: result.error };
    }
    
    revalidatePath("/admin/agents");
    
    return { success: true, agent: result.agent };
  } catch (error) {
    console.error("Error updating agent status:", error);
    return { error: "Failed to update agent status" };
  }
}

/**
 * Admin: Delete agent
 */
export async function deleteAgentAction(formData: FormData) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return { error: "Unauthorized" };
    }
    
    // Only admins can delete agents
    if (session.user.role !== "ADMIN") {
      return { error: "Unauthorized" };
    }
    
    const agentId = formData.get("agentId") as string;
    
    if (!agentId) {
      return { error: "Agent ID is required" };
    }
    
    // Get agent to get the user ID
    const agent = await getAgentById(agentId);
    
    if (!agent) {
      return { error: "Agent not found" };
    }
    
    // Delete agent
    const result = await deleteAgent(agentId);
    
    if (result.error) {
      return { error: result.error };
    }
    
    // Reset user role from AGENT to CUSTOMER
    await db.user.update({
      where: { id: agent.userId },
      data: { role: "CUSTOMER" },
    });
    
    revalidatePath("/admin/agents");
    
    return { success: true };
  } catch (error) {
    console.error("Error deleting agent:", error);
    return { error: "Failed to delete agent" };
  }
} 