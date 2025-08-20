import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerActionClient } from '@/lib/supabase/action';
import { supabaseAdmin } from '@/lib/supabase/admin';

// POST /api/agent/mark-ready
// Body: { orderId: string }
export async function POST(req: NextRequest) {
  try {
    const { orderId } = await req.json();
    if (!orderId) {
      return NextResponse.json({ error: 'Missing params' }, { status: 400 });
    }

    // Ensure the request is coming from an authenticated user (agent)
    const supabaseUser = await createSupabaseServerActionClient(false);
    const {
      data: { user },
      error: userErr,
    } = await supabaseUser.auth.getUser();

    if (userErr || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch agent record for this user
    const { data: agentRec } = await supabaseAdmin
      .from('Agent')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    // Agent profile is optional – allow if not present but log warning
    const agentId = agentRec?.id ?? null;

    // Verify order is in DROPPED_OFF state and still pending pickup
    const { data: orderRow, error: orderErr } = await supabaseAdmin
      .from('Order')
      .select('status, pickup_status, agent_id, customer_id')
      .eq('id', orderId)
      .single();

    if (orderErr || !orderRow) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (orderRow.status !== 'DROPPED_OFF' || orderRow.pickup_status !== 'PENDING') {
      return NextResponse.json({ error: 'Order is not eligible for marking ready' }, { status: 400 });
    }

    // Optional: ensure current agent is assigned to the order (if agent_id is set)
    if (orderRow.agent_id && agentId && orderRow.agent_id !== agentId) {
      return NextResponse.json({ error: 'You are not assigned to this order' }, { status: 403 });
    }

    // Update order status → READY_FOR_PICKUP
    const nowIso = new Date().toISOString();
    const { error: updErr } = await supabaseAdmin
      .from('Order')
      .update({
        status: 'READY_FOR_PICKUP',
        pickup_status: 'READY_FOR_PICKUP',
        updated_at: nowIso,
      })
      .eq('id', orderId);

    if (updErr) {
      return NextResponse.json({ error: updErr.message }, { status: 500 });
    }

    /* ------------------------------------------------------------
       Notify customer that order is ready for pickup
    ------------------------------------------------------------ */
    try {
      if (orderRow.customer_id) {
        const { data: custRow } = await supabaseAdmin
          .from('Customer')
          .select('user_id')
          .eq('id', orderRow.customer_id)
          .single();

        if (custRow?.user_id) {
          await supabaseAdmin.from('Notification').insert({
            user_id: custRow.user_id,
            title: 'Order Ready for Pickup',
            message: `Your order #${orderId.substring(0, 8)} is ready for pickup.`,
            type: 'PICKUP_READY',
            order_id: orderId,
          } as any);
        }
      }
    } catch (notifyErr) {
      console.error('Notification error:', notifyErr);
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
