import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const vendorId = searchParams.get('vendorId');

    if (!vendorId) {
      return NextResponse.json({ error: 'vendorId query param required' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Fetch latest 50 order items for vendor
    const { data: orderItems, error: orderItemsError } = await supabase
      .from('OrderItem')
      .select(
        `id, order_id, quantity, price_at_purchase, status, created_at,
          Product:product_id(name)`
      )
      .eq('vendor_id', vendorId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (orderItemsError) {
      return NextResponse.json({ error: orderItemsError.message }, { status: 500 });
    }

    const orderIds = [...new Set(orderItems.map((i) => i.order_id))];

    const { data: orders, error: ordersError } = await supabase
      .from('Order')
      .select('id, status, payment_status, total_amount, created_at, Customer:customer_id(User:user_id(name))')
      .in('id', orderIds);

    if (ordersError) {
      return NextResponse.json({ error: ordersError.message }, { status: 500 });
    }

    const ordersMap: Record<string, any> = Object.fromEntries(orders.map((o) => [o.id, o]));

    return NextResponse.json({ orderItems, ordersMap });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
} 