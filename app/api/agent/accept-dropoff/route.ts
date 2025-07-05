import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerActionClient } from '@/lib/supabase/action';

export async function POST(req: NextRequest) {
  try {
    const { orderId, code } = await req.json();
    if (!orderId || !code) {
      return NextResponse.json({ error: 'Missing params' }, { status: 400 });
    }

    // Use Service Role for privileged update due to RLS
    const supabase = await createSupabaseServerActionClient(false);

    // Retrieve order to compare drop-off code & ensure still pending
    const { data: rawOrder, error: orderErr } = await supabase
      .from('Order')
      .select('id, status, pickup_status, dropoff_code, pickup_code, customer_id')
      .eq('id', orderId)
      .single();

    if (orderErr || !rawOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const order: any = rawOrder;

    // Order must be in PROCESSING state *and* still pending pickup to accept drop-off
    if (order.status !== 'PROCESSING' || order.pickup_status !== 'PENDING') {
      return NextResponse.json({ error: 'Order not eligible for drop-off' }, { status: 400 });
    }

    // For now we reuse dropoff_code as drop-off token
    if (order.dropoff_code !== code) {
      return NextResponse.json({ error: 'Invalid drop-off code' }, { status: 400 });
    }

    // Retrieve current user & corresponding agent record
    const { data: { user }, error: userErr } = await supabase.auth.getUser();

    if (userErr || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: agentRec } = await supabase
      .from('Agent')
      .select('id, location')
      .eq('user_id', user.id)
      .maybeSingle();

    let agentId = agentRec?.id ?? null;
    let agentLocation = agentRec?.location ?? 'Pickup Counter';

    // If the signed-in user has no Agent profile, create a minimal one so
    // the order can safely reference agent_id without tripping RLS.
    if (!agentId) {
      const { data: newAgent, error: insertErr } = await supabase
        .from('Agent')
        .insert({ user_id: user.id, location: agentLocation })
        .select('id')
        .single();

      if (insertErr) {
        console.error('Agent auto-create error:', insertErr.message);
        // don't fail the request – continue with null agent_id
      } else {
        agentId = newAgent.id;
      }
    }

    // Fetch extra data required for printing the drop-off label
    const { data: customerInfo } = await supabase
      .from('Customer')
      .select('first_name, phone')
      .eq('id', order.customer_id)
      .single();

    const customerFirstName = customerInfo?.first_name ?? '';
    const phone = customerInfo?.phone ?? '';
    const maskedPhone = phone && phone.length > 4 ? `${phone.slice(0, 3)}${phone.slice(-4)}` : phone;

    // Update order: assign agent and mark ready for pickup
    const nowIso = new Date().toISOString();
    const updatePayload: Record<string, any> = {
      status: 'READY_FOR_PICKUP',
      pickup_status: 'READY_FOR_PICKUP',
      updated_at: nowIso,
    };
    if (agentId) updatePayload.agent_id = agentId;

    const { error: updErr } = await supabase
      .from('Order')
      .update(updatePayload)
      .eq('id', orderId);

    if (updErr) {
      return NextResponse.json({ error: updErr.message }, { status: 500 });
    }

    /* ------------------------------------------------------------------
       Mini-printer – send payload to local printing service (optional)
    ------------------------------------------------------------------ */
    try {
      if (process.env.PRINTER_ENDPOINT) {
        await fetch(`${process.env.PRINTER_ENDPOINT}/print`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'dropoff-label',
            orderId,
            dropoffCode: order.dropoff_code,
            pickupCode: order.pickup_code,
            customerFirstName,
            customerMaskedPhone: maskedPhone,
            agentLocation,
            timestamp: nowIso,
          }),
        });
      }
    } catch (printErr) {
      console.error('Printer error:', printErr);
    }

    /* ------------------------------------------------------------------
       Notifications – customer & vendor
    ------------------------------------------------------------------ */
    try {
      // Get customer user_id
      const { data: customerRec } = await supabase
        .from('Customer')
        .select('user_id')
        .eq('id', order.customer_id)
        .single();

      // Get vendor user_id via first order item
      const { data: firstItem } = await supabase
        .from('OrderItem')
        .select('vendor_id')
        .eq('order_id', orderId)
        .limit(1)
        .single();

      let vendorUserId: string | null = null;
      if (firstItem) {
        const { data: vendorRec } = await supabase
          .from('Vendor')
          .select('user_id')
          .eq('id', firstItem.vendor_id)
          .single();
        vendorUserId = vendorRec?.user_id ?? null;
      }

      const inserts = [] as any[];
      if (customerRec?.user_id) {
        inserts.push({
          user_id: customerRec.user_id,
          title: 'Order Ready for Pickup',
          message: `Your order #${orderId.substring(0, 8)} is now ready at the pickup point.`,
          type: 'PICKUP_READY',
          order_id: orderId,
        });
      }
      if (vendorUserId) {
        inserts.push({
          user_id: vendorUserId,
          title: 'Drop-off Accepted',
          message: `Agent has accepted your drop-off for order #${orderId.substring(0, 8)}.`,
          type: 'ORDER_STATUS_CHANGE',
          order_id: orderId,
        });
      }

      if (inserts.length) {
        await supabase.from('Notification').insert(inserts);
      }
    } catch (notifyErr) {
      console.error('Notification error:', notifyErr);
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
} 