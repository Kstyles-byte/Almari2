import { NextRequest, NextResponse } from 'next/server';
import { createServerActionClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const { orderId, code } = await req.json();
    if (!orderId || !code) {
      return NextResponse.json({ error: 'Missing params' }, { status: 400 });
    }

    const supabase = await createServerActionClient();

    // Get order for verification
    const { data: order, error: orderErr } = await supabase
      .from('Order')
      .select('pickup_code, pickup_status, status, customer_id')
      .eq('id', orderId)
      .single();

    if (orderErr || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.pickup_code !== code) {
      return NextResponse.json({ error: 'Invalid code' }, { status: 400 });
    }

    // Update status
    const { error: updErr } = await supabase
      .from('Order')
      .update({ pickup_status: 'PICKED_UP', status: 'DELIVERED', actual_pickup_date: new Date().toISOString() })
      .eq('id', orderId);

    if (updErr) {
      return NextResponse.json({ error: updErr.message }, { status: 500 });
    }

    /* ------------------------------------------------------------------
       Notifications – customer & vendor
    ------------------------------------------------------------------ */
    try {
      // Fetch customer user_id via Order → Customer
      const { data: customerRec } = await supabase
        .from('Customer')
        .select('user_id')
        .eq('id', order.customer_id)
        .single();

      // Fetch vendor user id via first OrderItem
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

      const inserts: any[] = [];
      if (customerRec?.user_id) {
        inserts.push({
          user_id: customerRec.user_id,
          title: 'Order Picked Up',
          message: `Thanks for picking up your order #${orderId.substring(0, 8)}.`,
          type: 'ORDER_PICKED_UP',
          order_id: orderId,
        });
      }
      if (vendorUserId) {
        inserts.push({
          user_id: vendorUserId,
          title: 'Order Item Picked Up',
          message: `Customer has picked up order #${orderId.substring(0, 8)}.`,
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