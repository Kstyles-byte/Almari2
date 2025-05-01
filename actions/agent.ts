"use server";

import { auth } from "../auth";
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
import { createClient } from '@supabase/supabase-js';
import type { Order, Agent } from "@/types";

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error("Supabase URL/Key missing in agent actions.");
  // Handle appropriately
}
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

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
    const { error: userUpdateError } = await supabase
      .from('User') // Ensure this matches your custom User table name
      .update({ role: 'AGENT', updatedAt: new Date().toISOString() })
      .eq('id', userId);

    if (userUpdateError) {
      // Log the error but maybe don't fail the whole action if agent creation succeeded?
      // Or rollback agent creation? Requires transaction logic.
      console.error("Error updating user role after agent creation:", userUpdateError.message);
      // Decide on error handling: return { error: "Failed to update user role." };
    }
    
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
    
    // Use the service function to update the status
    // The service function should ideally handle checking if the order exists
    // and potentially if it's assigned to the correct agent if needed (though agent actions imply agent context)

    // Before marking ready, generate the pickup code if it doesn't exist.
    // Fetch order just to get code status.
    const { data: orderData, error: fetchOrderError } = await supabase
      .from('Order')
      .select('pickupCode, agentId')
      .eq('id', orderId)
      .maybeSingle();

    if (fetchOrderError || !orderData) {
      return { error: fetchOrderError?.message || "Order not found" };
    }

    // Verify order belongs to this agent
    if (orderData.agentId !== agent.id) {
      return { error: "Not authorized to update this order" };
    }

    // Generate pickup code only if it's null/empty
    let pickupCode = orderData.pickupCode;
    if (!pickupCode) {
        pickupCode = generatePickupCode();
        // Update the order with the pickup code first
        const { error: codeUpdateError } = await supabase
            .from('Order')
            .update({ pickupCode: pickupCode, updatedAt: new Date().toISOString() })
            .eq('id', orderId);

        if (codeUpdateError) {
            console.error("Error setting pickup code:", codeUpdateError.message);
            return { error: "Failed to set pickup code for the order." };
        }
    }

    // Now update the status using the service function
    const result = await updateOrderPickupStatus(orderId, 'READY_FOR_PICKUP');

    if (result.error) {
      return { error: result.error };
    }

    revalidatePath("/agent/orders");
    revalidatePath(`/agent/orders/${orderId}`);
    
    return { success: true, order: result.order };
  } catch (error) {
    console.error("Error marking order ready for pickup:", error);
    return { error: "Failed to mark order ready for pickup" };
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
    
    // Use the service function to verify the code
    const verifyResult = await verifyPickupCode(orderId, pickupCode);

    if (!verifyResult.success || !verifyResult.order) {
      return { error: verifyResult.error || "Verification failed" };
    }

    // Check if the order is assigned to this agent (optional check, service might handle it)
    if (verifyResult.order.agentId !== agent.id) {
      return { error: "Not authorized to manage this order" };
    }

    // If code is valid and order is ready, update status using the service function
    const updateResult = await updateOrderPickupStatus(orderId, 'PICKED_UP', new Date());

    if (updateResult.error) {
      return { error: updateResult.error };
    }

    revalidatePath("/agent/orders");
    revalidatePath(`/agent/orders/${orderId}`);
    
    return { success: true, order: updateResult.order };
  } catch (error) {
    console.error("Error verifying customer pickup:", error);
    return { error: "Failed to verify customer pickup" };
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
  // NOTE: This is an ADMIN action based on revalidatePath("/admin/agents")
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return { error: "Unauthorized" };
    }
    
    const page = options?.page || 1;
    const limit = options?.limit || 10;
    const skip = (page - 1) * limit;
    
    let queryBuilder = supabase
      .from('Agent')
      .select('*' , { count: 'exact' });

    // Apply filters
    if (options?.isActive !== undefined) {
      queryBuilder = queryBuilder.eq('isActive', options.isActive);
    }

    // Fetch data with count
    queryBuilder = queryBuilder
      .order('createdAt', { ascending: false })
      .range(skip, skip + limit - 1);
    // Destructure the response from Supabase query to get:
    // - data: The agents array
    // - error: Any error that occurred
    // - count: Total number of records
    const { data: agents, error, count } = await queryBuilder;



    if (error) {
      console.error("Error fetching agents:", error.message);
      throw error;
    }

    return {
      success: true,
      data: agents,
      meta: {
        total: count ?? 0,
        page,
        limit,
        pageCount: Math.ceil((count ?? 0) / limit),
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
    
    // Store the agent's userId before potentially deleting the agent record
    const agentToDelete = await getAgentById(agentId);
    if (!agentToDelete) {
        return { error: "Agent not found." };
    }
    const userIdToUpdate = agentToDelete.userId;

    // Delete agent using service function
    const result = await deleteAgent(agentId);

    if (result.error) {
      return { error: result.error };
    }

    // Update user role back to customer (or handle appropriately)
    const { error: userUpdateError } = await supabase
      .from('User')
      .update({ role: 'CUSTOMER', updatedAt: new Date().toISOString() }) // Assuming role becomes CUSTOMER
      .eq('id', userIdToUpdate);

    if (userUpdateError) {
      console.error("Error updating user role after agent deletion:", userUpdateError.message);
      // Decide on handling - deletion succeeded, but role update failed.
      // Maybe log it and return success? Or return a specific error/warning?
      // For now, let's return success but log the error.
    }

    revalidatePath("/admin/agents");
    
    return { success: true };
  } catch (error) {
    console.error("Error deleting agent:", error);
    return { error: error instanceof Error ? error.message : "Failed to delete agent" };
  }
} 