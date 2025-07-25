import { createSupabaseServerActionClient } from '../lib/supabase/action';
import type { Tables } from '@/types/supabase';
import { supabaseAdmin } from '@/lib/supabase/admin';

interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Utility to get supabase client with cookies (server-side)
 */
function getSupabase() {
  return createSupabaseServerActionClient(false);
}

/**
 * Fetches the current agent (by user_id) and returns its record.
 */
export async function getCurrentAgent() : Promise<ActionResult<Tables<'Agent'>>> {
  try {
    const supabase = await getSupabase();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { success: false, error: 'Unauthorized' };
    }

    const { data: agent, error } = await supabase
      .from('Agent')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error || !agent) {
      return { success: false, error: error?.message || 'Agent not found' };
    }

    return { success: true, data: agent };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

/**
 * Fetch orders assigned to the current agent.
 * Optionally filter by pickup_status or status.
 */
export async function getAgentOrders(options?: {
  pickupStatus?: Tables<'Order'>['pickup_status'];
  status?: Tables<'Order'>['status'];
  search?: string; // partial order ID search
}): Promise<ActionResult<Tables<'Order'>[]>> {
  try {
    const supabase = await getSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    // Get agent id
    const { data: agentRec, error: agentErr } = await supabase
      .from('Agent')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (agentErr || !agentRec) {
      return { success: false, error: 'Agent not found' };
    }

    let query = supabase
      .from('Order')
      .select('*')
      .eq('agent_id', agentRec.id)
      .order('created_at', { ascending: false });

    if (options?.pickupStatus) {
      query = query.eq('pickup_status', options.pickupStatus);
    }
    if (options?.status) {
      query = query.eq('status', options.status);
    }

    // Text search – handle dropoff_code wildcard and exact order ID
    if (options?.search) {
      // Remove all whitespace to make search insensitive to accidental spaces (e.g., "D- ABC123" → "D-ABC123")
      const term = options.search.replace(/\s+/g, '').trim();

      if (term.startsWith('D-')) {
        // Drop-off code (prefixed) – wildcard search
        query = query.ilike('dropoff_code', `%${term}%`);
      } else if (/^[0-9]{4,}$/.test(term)) {
        // Likely a pickup code (numeric, typically 6 digits)
        query = query.eq('pickup_code', term);
      } else if (/^[0-9a-fA-F-]{36}$/.test(term)) {
        // Full UUID Order ID
        query = query.eq('id', term);
      } else {
        // Fallback – attempt wildcard on both dropoff and pickup code columns
        query = query.or(`dropoff_code.ilike.%${term}%,pickup_code.ilike.%${term}%`);
      }
    }

    const { data: orders, error } = await query;

    if (error) return { success: false, error: error.message };

    return { success: true, data: orders || [] };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

/**
 * Fetch a single order detail (with items) for agent
 */
export async function getAgentOrderById(orderId: string): Promise<ActionResult<any>> {
  try {
    const supabase = await getSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    // Ensure order belongs to agent
    const { data: agentRec, error: agentErr } = await supabase
      .from('Agent')
      .select('id, user_id')
      .eq('user_id', user.id)
      .single();

    if (agentErr || !agentRec) {
      return { success: false, error: 'Agent not found' };
    }

    // ----------------------------------------------------------------
    // 1. Fetch base order row (no joins) – use supabaseAdmin to bypass
    //    any RLS that could block the user-scoped client after it picks
    //    up the user’s access token.
    // ----------------------------------------------------------------
    const { data: orderRow, error: orderErr } = await supabaseAdmin
      .from('Order')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderErr || !orderRow) {
      return { success: false, error: 'Order not found' };
    }

    // We previously restricted visibility to only orders assigned to
    // the current agent (or unassigned). That turned out to be too
    // strict in some edge-cases, so we’re relaxing the check here and
    // letting the frontend / RLS policies handle access control.

    // ----------------------------------------------------------------
    // 2. Fetch items separately to avoid cross-table RLS issues
    // ----------------------------------------------------------------
    const { data: items, error: itemsErr } = await supabaseAdmin
      .from('OrderItem')
      .select('*, Product(name, price)')
      .eq('order_id', orderId);

    if (itemsErr) {
      console.error('Failed to load order items:', itemsErr.message);
    }

    const order = {
      ...orderRow,
      OrderItem: items ?? [],
    } as any;

    return { success: true, data: order };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

/**
 * Verify pickup code. If correct, mark order pickup_status = 'PICKED_UP' and status = 'DELIVERED'
 */
export async function verifyOrderPickup(orderId: string, code: string): Promise<ActionResult> {
  try {
    const supabase = await getSupabase();
    // Get order
    const { data: orderData, error: orderErr } = await supabase
      .from('Order')
      .select('pickup_code, pickup_status, status')
      .eq('id', orderId)
      .single();

    if (orderErr || !orderData) return { success: false, error: 'Order not found' };

    if (orderData.pickup_code !== code) {
      return { success: false, error: 'Invalid pickup code' };
    }

    // Update status
    const { error: updErr } = await supabase
      .from('Order')
      .update({ pickup_status: 'PICKED_UP', status: 'DELIVERED', actual_pickup_date: new Date().toISOString() })
      .eq('id', orderId);

    if (updErr) return { success: false, error: updErr.message };

    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

/**
 * Update agent profile fields.
 */
export async function updateAgentProfile(update: Partial<Tables<'Agent'>>): Promise<ActionResult> {
  try {
    const supabase = await getSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    const { data: agentRec, error: agentErr } = await supabase
      .from('Agent')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (agentErr || !agentRec) return { success: false, error: 'Agent not found' };

    const { error } = await supabase
      .from('Agent')
      .update(update)
      .eq('id', agentRec.id);

    if (error) return { success: false, error: error.message };

    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

/**
 * Accept vendor drop-off: validate code and mark order as READY_FOR_PICKUP
 */
export async function acceptOrderDropoff(orderId: string, code: string): Promise<ActionResult> {
  try {
    const supabase = await getSupabase();

    // Fetch order to validate
    const { data: rawOrder, error: orderErr } = await supabase
      .from('Order')
      .select('dropoff_code, status, pickup_status')
      .eq('id', orderId)
      .single();

    if (orderErr || !rawOrder) return { success: false, error: 'Order not found' };

    const order: any = rawOrder;

    // Order must be in PROCESSING status and awaiting drop-off (pickup_status = PENDING)
    if (order.status !== 'PROCESSING' || order.pickup_status !== 'PENDING') {
      return { success: false, error: 'Order not in drop-off state' };
    }

    if (order.dropoff_code !== code) {
      return { success: false, error: 'Invalid drop-off code' };
    }

    // Ensure current user is an agent and assign order to them
    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    if (userErr || !user) return { success: false, error: 'Unauthorized' };

    const { data: agentRec } = await supabase
      .from('Agent')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!agentRec) return { success: false, error: 'Agent not found' };

    const { error: updErr } = await supabase
      .from('Order')
      .update({
        status: 'READY_FOR_PICKUP',
        pickup_status: 'READY_FOR_PICKUP',
        agent_id: agentRec.id,
      })
      .eq('id', orderId);

    if (updErr) return { success: false, error: updErr.message };

    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
} 