import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { 
  createNotificationFromTemplate, 
  createBatchNotifications 
} from '../services/notificationService';

// Define types for agent notifications
type PickupStatus = 'PENDING' | 'READY_FOR_PICKUP' | 'PICKED_UP';
type OrderStatus = 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'READY_FOR_PICKUP';

interface Agent {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone_number: string;
  city: string;
  state_province: string;
  is_active: boolean;
  capacity: number;
}

interface Order {
  id: string;
  customer_id: string;
  agent_id: string | null;
  status: OrderStatus;
  pickup_status: PickupStatus;
  pickup_code: string | null;
  total_amount: number;
  estimated_pickup_date: string | null;
  actual_pickup_date: string | null;
}

interface CustomerWithAddress {
  id: string;
  user_id: string;
  Address: Array<{
    id: string;
    city: string;
    state_province: string;
    address_line1: string;
    is_default: boolean;
  }>;
}

/**
 * Create Supabase SSR client for notifications
 */
async function createSupabaseClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );
}

/**
 * Get agent user ID from agent ID
 */
async function getAgentUserId(agentId: string): Promise<string | null> {
  const supabase = await createSupabaseClient();
  
  const { data: agent } = await supabase
    .from('Agent')
    .select('user_id')
    .eq('id', agentId)
    .single();
  
  return agent?.user_id || null;
}

/**
 * Get agents in the same city/region for location-based filtering
 */
async function getAgentsInLocation(city: string, stateProvince: string): Promise<Agent[]> {
  const supabase = await createSupabaseClient();
  
  const { data: agents, error } = await supabase
    .from('Agent')
    .select('*')
    .eq('city', city)
    .eq('state_province', stateProvince)
    .eq('is_active', true);
  
  if (error) {
    console.error('[Agent Notifications] Error fetching agents in location:', error.message);
    return [];
  }
  
  return agents || [];
}

/**
 * Send new pickup assignment notification to agent
 */
export async function sendPickupAssignmentNotification(orderId: string, agentId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createSupabaseClient();
    
    // Get order details with customer address
    const { data: order, error: orderError } = await supabase
      .from('Order')
      .select(`
        id,
        customer_id,
        total_amount,
        pickup_code,
        estimated_pickup_date,
        Customer (
          id,
          Address (
            id,
            city,
            state_province,
            address_line1,
            is_default
          )
        )
      `)
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      throw new Error(`Order not found: ${orderError?.message}`);
    }

    // Get agent user ID
    const agentUserId = await getAgentUserId(agentId);
    if (!agentUserId) {
      throw new Error('Agent user ID not found');
    }

    // Get customer's default address or first address
    const customerAddresses = (order as any).Customer?.Address || [];
    const defaultAddress = customerAddresses.find((addr: any) => addr.is_default) || customerAddresses[0];
    
    const pickupLocation = defaultAddress 
      ? `${defaultAddress.address_line1}, ${defaultAddress.city}` 
      : 'Address not available';

    return await createNotificationFromTemplate(
      'NEW_PICKUP_ASSIGNMENT',
      agentUserId,
      { 
        orderId: order.id,
        pickupCode: order.pickup_code || 'N/A',
        pickupLocation,
        totalAmount: order.total_amount,
        estimatedDate: order.estimated_pickup_date
      },
      {
        orderId: order.id,
        referenceUrl: `/agent/orders/${order.id}`
      }
    );

  } catch (error) {
    console.error('[Agent Notifications] Error sending pickup assignment notification:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to send pickup assignment notification' 
    };
  }
}

/**
 * Send route optimization alert to agents in specific area
 */
export async function sendRouteOptimizationAlert(
  city: string, 
  stateProvince: string, 
  orderIds: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get agents in the specified location
    const agents = await getAgentsInLocation(city, stateProvince);
    
    if (agents.length === 0) {
      return { success: true }; // No agents in this location
    }

    // Create notifications for all agents in the area
    const notifications = agents.map(agent => ({
      userId: agent.user_id,
      title: 'Route Optimization Available',
      message: `${orderIds.length} new pickup(s) available in ${city}. Optimize your route for efficient delivery.`,
      type: 'NEW_PICKUP_ASSIGNMENT' as const,
      referenceUrl: `/agent/dashboard?optimize=true&city=${encodeURIComponent(city)}`
    }));

    const result = await createBatchNotifications(notifications);
    
    if (!result.success) {
      throw new Error(`Failed to create batch notifications: ${result.errors?.join(', ')}`);
    }

    console.log(`[Agent Notifications] Sent route optimization alerts to ${notifications.length} agents in ${city}, ${stateProvince}`);
    return { success: true };

  } catch (error) {
    console.error('[Agent Notifications] Error sending route optimization alerts:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to send route optimization alerts' 
    };
  }
}

/**
 * Send pickup completion confirmation to agent
 */
export async function sendPickupCompletionConfirmation(orderId: string, agentId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createSupabaseClient();
    
    // Get order details
    const { data: order, error: orderError } = await supabase
      .from('Order')
      .select('id, total_amount, actual_pickup_date')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      throw new Error(`Order not found: ${orderError?.message}`);
    }

    // Get agent user ID
    const agentUserId = await getAgentUserId(agentId);
    if (!agentUserId) {
      throw new Error('Agent user ID not found');
    }

    return await createNotificationFromTemplate(
      'PICKUP_COMPLETED',
      agentUserId,
      { 
        orderId: order.id,
        totalAmount: order.total_amount,
        pickupDate: order.actual_pickup_date || new Date().toISOString()
      },
      {
        orderId: order.id,
        referenceUrl: `/agent/orders/${order.id}`
      }
    );

  } catch (error) {
    console.error('[Agent Notifications] Error sending pickup completion confirmation:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to send pickup completion confirmation' 
    };
  }
}

/**
 * Send return/refund pickup assignment to agent
 */
export async function sendReturnPickupAssignment(returnId: string, agentId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createSupabaseClient();
    
    // Get return details with order and customer info
    const { data: returnData, error: returnError } = await supabase
      .from('Return')
      .select(`
        id,
        order_id,
        refund_amount,
        reason,
        Order (
          id,
          Customer (
            id,
            Address (
              id,
              city,
              state_province,
              address_line1,
              is_default
            )
          )
        )
      `)
      .eq('id', returnId)
      .single();

    if (returnError || !returnData) {
      throw new Error(`Return not found: ${returnError?.message}`);
    }

    // Get agent user ID
    const agentUserId = await getAgentUserId(agentId);
    if (!agentUserId) {
      throw new Error('Agent user ID not found');
    }

    // Get customer's default address
    const customerAddresses = (returnData as any).Order?.Customer?.Address || [];
    const defaultAddress = customerAddresses.find((addr: any) => addr.is_default) || customerAddresses[0];
    
    const pickupLocation = defaultAddress 
      ? `${defaultAddress.address_line1}, ${defaultAddress.city}` 
      : 'Address not available';

    return await createNotificationFromTemplate(
      'RETURN_PICKUP_ASSIGNMENT',
      agentUserId,
      { 
        returnId: returnData.id,
        orderId: returnData.order_id,
        refundAmount: returnData.refund_amount,
        reason: returnData.reason,
        pickupLocation
      },
      {
        returnId: returnData.id,
        referenceUrl: `/agent/returns/${returnData.id}`
      }
    );

  } catch (error) {
    console.error('[Agent Notifications] Error sending return pickup assignment:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to send return pickup assignment' 
    };
  }
}

/**
 * Send refund pickup reminder to agent
 */
export async function sendRefundPickupReminder(returnId: string, agentId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createSupabaseClient();
    
    // Get return details
    const { data: returnData, error: returnError } = await supabase
      .from('Return')
      .select('id, order_id, refund_amount')
      .eq('id', returnId)
      .single();

    if (returnError || !returnData) {
      throw new Error(`Return not found: ${returnError?.message}`);
    }

    // Get agent user ID
    const agentUserId = await getAgentUserId(agentId);
    if (!agentUserId) {
      throw new Error('Agent user ID not found');
    }

    return await createNotificationFromTemplate(
      'REFUND_PICKUP_REMINDER',
      agentUserId,
      { 
        returnId: returnData.id,
        orderId: returnData.order_id,
        refundAmount: returnData.refund_amount
      },
      {
        returnId: returnData.id,
        referenceUrl: `/agent/returns/${returnData.id}`
      }
    );

  } catch (error) {
    console.error('[Agent Notifications] Error sending refund pickup reminder:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to send refund pickup reminder' 
    };
  }
}

/**
 * Send agent location update notification
 */
export async function sendAgentLocationUpdateNotification(agentId: string, newLocationName: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Get agent user ID
    const agentUserId = await getAgentUserId(agentId);
    if (!agentUserId) {
      throw new Error('Agent user ID not found');
    }

    return await createNotificationFromTemplate(
      'AGENT_LOCATION_NAME_UPDATE',
      agentUserId,
      { 
        locationName: newLocationName
      },
      {
        referenceUrl: `/agent/profile`
      }
    );

  } catch (error) {
    console.error('[Agent Notifications] Error sending location update notification:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to send location update notification' 
    };
  }
}

/**
 * Comprehensive agent notification handler
 */
export async function handleAgentNotification(
  eventType: 'pickup_assigned' | 'return_assigned' | 'pickup_reminder' | 'pickup_completed' | 'location_updated' | 'route_optimization',
  data: {
    orderId?: string;
    returnId?: string;
    agentId?: string;
    city?: string;
    stateProvince?: string;
    orderIds?: string[];
    locationName?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`[Agent Notifications] Handling ${eventType}`, data);

    switch (eventType) {
      case 'pickup_assigned':
        if (!data.orderId || !data.agentId) {
          throw new Error('Order ID and Agent ID are required for pickup_assigned event');
        }
        return await sendPickupAssignmentNotification(data.orderId, data.agentId);
      
      case 'return_assigned':
        if (!data.returnId || !data.agentId) {
          throw new Error('Return ID and Agent ID are required for return_assigned event');
        }
        return await sendReturnPickupAssignment(data.returnId, data.agentId);
      
      case 'pickup_reminder':
        if (!data.returnId || !data.agentId) {
          throw new Error('Return ID and Agent ID are required for pickup_reminder event');
        }
        return await sendRefundPickupReminder(data.returnId, data.agentId);
      
      case 'pickup_completed':
        if (!data.orderId || !data.agentId) {
          throw new Error('Order ID and Agent ID are required for pickup_completed event');
        }
        return await sendPickupCompletionConfirmation(data.orderId, data.agentId);
      
      case 'location_updated':
        if (!data.agentId || !data.locationName) {
          throw new Error('Agent ID and location name are required for location_updated event');
        }
        return await sendAgentLocationUpdateNotification(data.agentId, data.locationName);
      
      case 'route_optimization':
        if (!data.city || !data.stateProvince || !data.orderIds) {
          throw new Error('City, state/province, and order IDs are required for route_optimization event');
        }
        return await sendRouteOptimizationAlert(data.city, data.stateProvince, data.orderIds);
      
      default:
        throw new Error(`Unsupported event type: ${eventType}`);
    }

  } catch (error) {
    console.error('[Agent Notifications] Error handling agent notification:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to handle agent notification' 
    };
  }
}

/**
 * Integration helper for pickup assignments
 */
export async function notifyAgentPickupAssignment(orderId: string, agentId: string): Promise<void> {
  const result = await handleAgentNotification('pickup_assigned', { orderId, agentId });
  
  if (!result.success) {
    console.error(`[Agent Notifications] Failed to send pickup assignment notification: ${result.error}`);
    // Don't throw error to avoid blocking the main assignment process
  }
}

/**
 * Integration helper for return pickup assignments
 */
export async function notifyAgentReturnAssignment(returnId: string, agentId: string): Promise<void> {
  const result = await handleAgentNotification('return_assigned', { returnId, agentId });
  
  if (!result.success) {
    console.error(`[Agent Notifications] Failed to send return assignment notification: ${result.error}`);
  }
}

/**
 * Integration helper for pickup completion
 */
export async function notifyAgentPickupCompletion(orderId: string, agentId: string): Promise<void> {
  const result = await handleAgentNotification('pickup_completed', { orderId, agentId });
  
  if (!result.success) {
    console.error(`[Agent Notifications] Failed to send pickup completion notification: ${result.error}`);
  }
}

/**
 * Integration helper for route optimization
 */
export async function notifyAgentsRouteOptimization(city: string, stateProvince: string, orderIds: string[]): Promise<void> {
  const result = await handleAgentNotification('route_optimization', { city, stateProvince, orderIds });
  
  if (!result.success) {
    console.error(`[Agent Notifications] Failed to send route optimization notifications: ${result.error}`);
  }
}

/**
 * Integration helper for location updates
 */
export async function notifyAgentLocationUpdate(agentId: string, newLocationName: string): Promise<void> {
  const result = await handleAgentNotification('location_updated', { agentId, locationName: newLocationName });
  
  if (!result.success) {
    console.error(`[Agent Notifications] Failed to send location update notification: ${result.error}`);
  }
}

/**
 * Bulk notification helper for multiple agents
 */
export async function sendBulkAgentNotifications(
  notifications: Array<{
    eventType: 'pickup_assigned' | 'return_assigned' | 'pickup_reminder';
    data: { orderId?: string; returnId?: string; agentId: string };
  }>
): Promise<{ success: boolean; error?: string; results: Array<{ success: boolean; error?: string }> }> {
  const results: Array<{ success: boolean; error?: string }> = [];
  let overallSuccess = true;

  for (const notification of notifications) {
    const result = await handleAgentNotification(notification.eventType, notification.data);
    results.push(result);
    
    if (!result.success) {
      overallSuccess = false;
    }
  }

  return {
    success: overallSuccess,
    error: overallSuccess ? undefined : 'Some agent notifications failed to send',
    results
  };
}
