import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerActionClient } from '@/lib/supabase/action';
import { supabaseAdmin } from '@/lib/supabase/admin';

// POST /api/vendor/mark-ready
// Body: { orderId: string }
export async function POST(req: NextRequest) {
  try {
    const { orderId } = await req.json();
    if (!orderId) {
      return NextResponse.json({ error: 'Missing params' }, { status: 400 });
    }

    // User-scoped client to verify session (SSR client as per guidelines)
    const supabaseUser = await createSupabaseServerActionClient(false);
    const {
      data: { user },
      error: userErr,
    } = await supabaseUser.auth.getUser();

    if (userErr || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Determine vendor ID for the signed-in user
    const { data: vendorRec, error: vendorErr } = await supabaseAdmin
      .from('Vendor')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (vendorErr || !vendorRec) {
      return NextResponse.json({ error: 'Vendor profile not found' }, { status: 403 });
    }

    const vendorId = vendorRec.id;

    // Verify that this vendor is associated with at least one item in the order
    const { data: itemCheck, error: itemErr } = await supabaseAdmin
      .from('OrderItem')
      .select('id')
      .eq('order_id', orderId)
      .eq('vendor_id', vendorId)
      .maybeSingle();

    if (itemErr || !itemCheck) {
      return NextResponse.json({ error: 'Order does not belong to vendor' }, { status: 403 });
    }

    // Fetch order to ensure it is in DROPPED_OFF state before updating
    const { data: orderRow, error: orderErr } = await supabaseAdmin
      .from('Order')
      .select('status, pickup_status')
      .eq('id', orderId)
      .single();

    if (orderErr || !orderRow) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (orderRow.status !== 'DROPPED_OFF') {
      return NextResponse.json({ error: 'Order is not in dropped off state' }, { status: 400 });
    }

    // Update order status to READY_FOR_PICKUP
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

    // TODO: optional notifications can be added here

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
