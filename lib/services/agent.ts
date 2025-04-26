import { db } from "../db";

/**
 * Create a new agent
 */
export async function createAgent(data: {
  userId: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  operatingHours?: string;
  capacity?: number;
}) {
  try {
    const agent = await db.agent.create({
      data: {
        userId: data.userId,
        name: data.name,
        email: data.email,
        phone: data.phone,
        location: data.location,
        operatingHours: data.operatingHours,
        capacity: data.capacity || 0,
      },
    });
    
    return { success: true, agent };
  } catch (error) {
    console.error("Error creating agent:", error);
    return { error: "Failed to create agent" };
  }
}

/**
 * Get agent by user ID
 */
export async function getAgentByUserId(userId: string) {
  try {
    const agent = await db.agent.findUnique({
      where: { userId },
    });
    
    return agent;
  } catch (error) {
    console.error("Error fetching agent by user ID:", error);
    return null;
  }
}

/**
 * Get agent by ID
 */
export async function getAgentById(agentId: string) {
  try {
    const agent = await db.agent.findUnique({
      where: { id: agentId },
    });
    
    return agent;
  } catch (error) {
    console.error("Error fetching agent by ID:", error);
    return null;
  }
}

/**
 * Get all agents with optional pagination
 */
export async function getAllAgents(options?: {
  page?: number;
  limit?: number;
  isActive?: boolean;
}) {
  try {
    const page = options?.page || 1;
    const limit = options?.limit || 10;
    const skip = (page - 1) * limit;
    
    const where = options?.isActive !== undefined
      ? { isActive: options.isActive }
      : {};
    
    const agents = await db.agent.findMany({
      where,
      take: limit,
      skip,
      orderBy: {
        createdAt: "desc",
      },
    });
    
    const total = await db.agent.count({ where });
    
    return {
      data: agents,
      meta: {
        total,
        page,
        limit,
        pageCount: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error("Error fetching agents:", error);
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
 * Update agent
 */
export async function updateAgent(agentId: string, data: {
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
  operatingHours?: string;
  capacity?: number;
  isActive?: boolean;
}) {
  try {
    const agent = await db.agent.update({
      where: { id: agentId },
      data,
    });
    
    return { success: true, agent };
  } catch (error) {
    console.error("Error updating agent:", error);
    return { error: "Failed to update agent" };
  }
}

/**
 * Delete agent
 */
export async function deleteAgent(agentId: string) {
  try {
    await db.agent.delete({
      where: { id: agentId },
    });
    
    return { success: true };
  } catch (error) {
    console.error("Error deleting agent:", error);
    return { error: "Failed to delete agent" };
  }
}

/**
 * Get orders assigned to an agent
 */
export async function getAgentOrders(agentId: string, options?: {
  page?: number;
  limit?: number;
  status?: string;
  pickupStatus?: string;
}) {
  try {
    const page = options?.page || 1;
    const limit = options?.limit || 10;
    const skip = (page - 1) * limit;
    
    const where: any = { agentId };
    
    if (options?.status) {
      where.status = options.status;
    }
    
    if (options?.pickupStatus) {
      where.pickupStatus = options.pickupStatus;
    }
    
    const orders = await db.order.findMany({
      where,
      include: {
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
        items: {
          include: {
            product: true,
            vendor: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
    });
    
    const total = await db.order.count({ where });
    
    return {
      data: orders,
      meta: {
        total,
        page,
        limit,
        pageCount: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error("Error fetching agent orders:", error);
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
 * Get pending pickups for an agent
 */
export async function getAgentPendingPickups(agentId: string, options?: {
  page?: number;
  limit?: number;
}) {
  try {
    const page = options?.page || 1;
    const limit = options?.limit || 10;
    const skip = (page - 1) * limit;
    
    const orders = await db.order.findMany({
      where: {
        agentId,
        pickupStatus: "READY_FOR_PICKUP",
      },
      include: {
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
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
      skip,
      take: limit,
    });
    
    const total = await db.order.count({
      where: {
        agentId,
        pickupStatus: "READY_FOR_PICKUP",
      },
    });
    
    return {
      data: orders,
      meta: {
        total,
        page,
        limit,
        pageCount: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error("Error fetching agent pending pickups:", error);
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
 * Find nearest agent with capacity
 */
export async function findNearestAgent(location: string) {
  try {
    // In a real implementation, this would use geolocation data
    // For now, we'll just find an active agent with capacity
    const agent = await db.agent.findFirst({
      where: {
        isActive: true,
        // In a real implementation: calculate distance to location
      },
      orderBy: {
        // In a real implementation: order by distance
        capacity: "desc", // For now, just pick the one with most capacity
      },
    });
    
    return agent;
  } catch (error) {
    console.error("Error finding nearest agent:", error);
    return null;
  }
}

/**
 * Generate pickup code
 */
export function generatePickupCode() {
  // Generate a random 6-digit code
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Update order pickup status
 */
export async function updateOrderPickupStatus(orderId: string, pickupStatus: string, pickupDate?: Date) {
  try {
    const updateData: any = { pickupStatus };
    
    if (pickupStatus === "PICKED_UP" && !pickupDate) {
      updateData.pickupDate = new Date();
    } else if (pickupDate) {
      updateData.pickupDate = pickupDate;
    }
    
    const order = await db.order.update({
      where: { id: orderId },
      data: updateData,
    });
    
    return { success: true, order };
  } catch (error) {
    console.error("Error updating order pickup status:", error);
    return { error: "Failed to update pickup status" };
  }
}

/**
 * Verify pickup code
 */
export async function verifyPickupCode(orderId: string, code: string) {
  try {
    const order = await db.order.findUnique({
      where: { id: orderId },
    });
    
    if (!order) {
      return { success: false, error: "Order not found" };
    }
    
    if (order.pickupStatus !== "READY_FOR_PICKUP") {
      return { success: false, error: "Order is not ready for pickup" };
    }
    
    if (order.pickupCode !== code) {
      return { success: false, error: "Invalid pickup code" };
    }
    
    // Update pickup status
    const updatedOrder = await db.order.update({
      where: { id: orderId },
      data: {
        pickupStatus: "PICKED_UP",
        pickupDate: new Date(),
      },
    });
    
    return { success: true, order: updatedOrder };
  } catch (error) {
    console.error("Error verifying pickup code:", error);
    return { success: false, error: "Failed to verify pickup code" };
  }
} 