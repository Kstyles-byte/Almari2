import { createClient } from '@supabase/supabase-js';
import type { Agent, Order } from '../../types/supabase'; // Assuming Order type exists
import { createPickupStatusNotification } from './notification';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error("Supabase URL or Service Role Key is missing in environment variables for agent service.");
}
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

// Define OrderStatus and PickupStatus enums (adjust based on your actual types/enums)
type OrderStatus = 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'PAYMENT_FAILED' | 'PARTIALLY_FULFILLED';
type PickupStatus = 'PENDING' | 'READY_FOR_PICKUP' | 'PICKED_UP';

/**
 * Create a new agent
 */
export async function createAgent(data: {
  userId: string;
  name: string;
  email: string; // Should this come from the User table instead?
  phone: string;
  location: string;
  operatingHours?: string;
  capacity?: number;
}): Promise<{ success: boolean; agent?: Agent | null; error?: string }> {
  try {
    const insertData = {
      userId: data.userId,
      name: data.name,
      email: data.email,
      phone: data.phone,
      location: data.location,
      operatingHours: data.operatingHours,
      capacity: data.capacity || 0,
      isActive: true, // Default to active?
      // createdAt/updatedAt handled by DB
    };

    const { data: agent, error } = await supabase
      .from('Agent')
      .insert(insertData)
      .select()
      .single();

    if (error) {
        // Handle potential unique constraint violation (e.g., duplicate userId)
        if (error.code === '23505') { // PostgreSQL unique violation code
             return { success: false, error: "Agent profile already exists for this user." };
        }
        console.error("Error creating agent:", error.message);
        throw new Error(`Failed to create agent: ${error.message}`);
    }

    return { success: true, agent };
  } catch (error) {
    console.error("Error in createAgent service:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to create agent" };
  }
}

/**
 * Get agent by user ID
 */
export async function getAgentByUserId(userId: string): Promise<Agent | null> {
  try {
    const { data: agent, error } = await supabase
      .from('Agent')
      .select('*')
      .eq('userId', userId)
      .maybeSingle();

    if (error) {
        if (error.code !== 'PGRST116') { // Ignore not found error
            console.error("Error fetching agent by user ID:", error.message);
            throw error;
        }
    }
    return agent;
  } catch (error) {
    console.error("Unexpected error fetching agent by user ID:", error);
    return null;
  }
}

/**
 * Get agent by ID
 */
export async function getAgentById(agentId: string): Promise<Agent | null> {
  try {
    const { data: agent, error } = await supabase
      .from('Agent')
      .select('*')
      .eq('id', agentId)
      .maybeSingle();

    if (error) {
         if (error.code !== 'PGRST116') { // Ignore not found error
            console.error("Error fetching agent by ID:", error.message);
            throw error;
        }
    }
    return agent;
  } catch (error) {
    console.error("Unexpected error fetching agent by ID:", error);
    return null;
  }
}

/**
 * Get all agents with optional pagination and filtering
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

    let query = supabase
      .from('Agent')
      .select('*' , { count: 'exact' });

    if (options?.isActive !== undefined) {
      query = query.eq('isActive', options.isActive);
    }

    query = query.order('createdAt', { ascending: false })
                 .range(skip, skip + limit - 1);

    const { data: agents, error, count } = await query;

    if (error) {
        console.error("Error fetching agents:", error.message);
        throw error;
    }

    return {
      data: agents || [],
      meta: {
        total: count ?? 0,
        page,
        limit,
        pageCount: Math.ceil((count ?? 0) / limit),
      },
    };
  } catch (error) {
    console.error("Error in getAllAgents service:", error);
    return {
      data: [],
      meta: { total: 0, page: 1, limit: 10, pageCount: 0 }, // Return default meta on error
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
}): Promise<{ success: boolean; agent?: Agent | null; error?: string }> {
  try {
    const updateData = { ...data, updatedAt: new Date().toISOString() };

    const { data: agent, error } = await supabase
      .from('Agent')
      .update(updateData)
      .eq('id', agentId)
      .select()
      .single();

    if (error) {
        console.error("Error updating agent:", error.message);
        // Handle case where agent might not be found (PGRST116)
        if (error.code === 'PGRST116') {
            return { success: false, error: "Agent not found." };
        }
        throw new Error(`Failed to update agent: ${error.message}`);
    }

    return { success: true, agent };
  } catch (error) {
    console.error("Error in updateAgent service:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to update agent" };
  }
}

/**
 * Delete agent
 */
export async function deleteAgent(agentId: string): Promise<{ success: boolean; error?: string }> {
  try {
     // Optional: Check if agent has assigned orders first?
     // const { count } = await supabase.from('Order').select('id', { count: 'exact', head: true }).eq('agentId', agentId).not('status', 'in', '("DELIVERED", "CANCELLED")');
     // if (count > 0) return { success: false, error: "Cannot delete agent with active orders." };

    const { error } = await supabase
      .from('Agent')
      .delete()
      .eq('id', agentId);

    if (error) {
        console.error("Error deleting agent:", error.message);
        throw new Error(`Failed to delete agent: ${error.message}`);
    }

    return { success: true };
  } catch (error) {
    console.error("Error in deleteAgent service:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to delete agent" };
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

    let query = supabase
      .from('Order')
      .select(`
        *,
        Customer:customerId (*, User:userId (name, email)),
        OrderItem ( *, Product:productId (*), Vendor:vendorId (*) )
      `, { count: 'exact' })
      .eq('agentId', agentId);

    if (options?.status) {
      query = query.eq('status', options.status as OrderStatus);
    }

    if (options?.pickupStatus) {
      query = query.eq('pickupStatus', options.pickupStatus as PickupStatus);
    }

    query = query.order('createdAt', { ascending: false })
                 .range(skip, skip + limit - 1);

    const { data: orders, error, count } = await query;

    if (error) {
        console.error("Error fetching agent orders:", error.message);
        throw error;
    }

    return {
      data: orders || [],
      meta: {
        total: count ?? 0,
        page,
        limit,
        pageCount: Math.ceil((count ?? 0) / limit),
      },
    };
  } catch (error) {
    console.error("Error in getAgentOrders service:", error);
    return {
      data: [],
      meta: { total: 0, page: 1, limit: 10, pageCount: 0 }, // Default meta
    };
  }
}

/**
 * Get pending pickups for an agent (Orders with pickupStatus = 'READY_FOR_PICKUP')
 */
export async function getAgentPendingPickups(agentId: string, options?: {
  page?: number;
  limit?: number;
}) {
  try {
    const page = options?.page || 1;
    const limit = options?.limit || 10;
    const skip = (page - 1) * limit;

    // Explicitly define the status to filter by
    const targetPickupStatus: PickupStatus = 'READY_FOR_PICKUP';

    let query = supabase
      .from('Order')
      .select(`
        *,
        Customer:customerId (*, User:userId (name, email)),
        OrderItem ( *, Product:productId (*) )
      `, { count: 'exact' })
      .eq('agentId', agentId)
      .eq('pickupStatus', targetPickupStatus); 

    query = query.order('updatedAt', { ascending: false }) // Order by when it became ready?
                 .range(skip, skip + limit - 1);

    const { data: orders, error, count } = await query;

    if (error) {
        console.error("Error fetching agent pending pickups:", error.message);
        throw error;
    }

    return {
      data: orders || [],
      meta: {
        total: count ?? 0,
        page,
        limit,
        pageCount: Math.ceil((count ?? 0) / limit),
      },
    };
  } catch (error) {
    console.error("Error in getAgentPendingPickups service:", error);
    return {
      data: [],
      meta: { total: 0, page: 1, limit: 10, pageCount: 0 }, // Default meta
    };
  }
}

/**
 * Find the nearest active agent to a given location.
 * NOTE: This is a simplified placeholder. Real implementation requires geospatial querying (e.g., PostGIS).
 * Currently, it returns the first active agent found.
 */
export async function findNearestAgent(location: string): Promise<Agent | null> {
  try {
    console.warn("findNearestAgent currently returns the first active agent found. Geospatial query not implemented.");
    const { data: agent, error } = await supabase
      .from('Agent')
      .select('*')
      .eq('isActive', true)
      .limit(1)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error("Error fetching nearest agent (placeholder):", error.message);
      throw error;
    }
    return agent;
  } catch (error) {
    console.error("Unexpected error in findNearestAgent:", error);
    return null;
  }
}

/**
 * Generates a random 6-digit pickup code.
 */
export function generatePickupCode(): string {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  return code;
}

/**
 * Generates a random 6-digit pickup code.
 * @param pickupDate Optional date when the pickup occurred
 * @returns The updated order object or null/error
 */
export async function updateOrderPickupStatus(
    orderId: string,
    pickupStatus: PickupStatus, // Use defined type
    pickupDate?: Date
): Promise<{ success: boolean; order?: Order | null; error?: string }> {
  try {
    const updatePayload: Partial<Order> & { updatedAt: string } = {
        pickupStatus: pickupStatus,
        updatedAt: new Date().toISOString()
    };

    if (pickupDate && pickupStatus === 'PICKED_UP') { // Use the specific enum value from schema
        updatePayload.pickupDate = pickupDate.toISOString();
    }

    // Check if order exists first (optional but good practice)
    const { data: existingOrder, error: fetchError } = await supabase
        .from('Order')
        .select('id, customerId') // Fetch needed fields for notification
        .eq('id', orderId)
        .single();

    if (fetchError || !existingOrder) {
        console.error("Error fetching order for status update or order not found:", fetchError?.message);
        return { success: false, error: "Order not found" };
    }

    // Update the order
    const { data: updatedOrder, error: updateError } = await supabase
      .from('Order')
      .update(updatePayload)
      .eq('id', orderId)
      .select('*') // Select the updated order data
      .single();

    if (updateError) {
        console.error("Error updating order pickup status:", updateError.message);
        throw new Error(`Failed to update pickup status: ${updateError.message}`);
    }

    // Send notification based on new status
    if (pickupStatus === 'READY_FOR_PICKUP') {
        await createPickupStatusNotification(orderId, 'PICKUP_READY');
    } else if (pickupStatus === 'PICKED_UP') {
        await createPickupStatusNotification(orderId, 'ORDER_PICKED_UP');
    }

    return { success: true, order: updatedOrder };

  } catch (error) {
    console.error("Error in updateOrderPickupStatus service:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to update pickup status" };
  }
}

/**
 * Verify the pickup code for an order
 */
export async function verifyPickupCode(orderId: string, code: string): Promise<{ success: boolean; order?: Order | null; error?: string }> {
  try {
    // Fetch the order and check the pickup code
    const { data: order, error } = await supabase
      .from('Order')
      .select('*')
      .eq('id', orderId)
      .single();

    if (error) {
        console.error("Error fetching order for pickup code verification:", error.message);
        if (error.code === 'PGRST116') {
            return { success: false, error: "Order not found." };
        }
        throw error; // Rethrow other DB errors
    }

    if (!order) {
        return { success: false, error: "Order not found (post-fetch)." };
    }

    // Check if already picked up
    if (order.pickupStatus === 'PICKED_UP') {
        return { success: false, error: "Order has already been picked up." };
    }

    // Check if ready for pickup
    if (order.pickupStatus !== 'READY_FOR_PICKUP') {
        return { success: false, error: "Order is not yet ready for pickup." };
    }

    // Verify the code
    if (order.pickupCode !== code) {
      return { success: false, error: "Invalid pickup code." };
    }

    // Code is valid, return success and the order (or relevant parts)
    return { success: true, order };

  } catch (error) {
    console.error("Error in verifyPickupCode service:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to verify pickup code" };
  }
} 