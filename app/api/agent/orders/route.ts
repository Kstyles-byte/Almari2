import { supabaseAdmin } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const agentId = searchParams.get('agentId');
  
  if (!agentId) {
    return new Response('agentId missing', { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('Order')
    .select(`
      id,
      short_id,
      status,
      payment_status,
      total_amount,
      created_at,
      pickup_code,
      dropoff_code,
      pickup_status,
      Customer:customer_id(
        User:user_id(name)
      ),
      OrderItem:OrderItem(
        id,
        quantity,
        price_at_purchase,
        Product:product_id(name)
      )
    `)
    .eq('agent_id', agentId)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error }, { status: 500 });
  }

  // Transform the data to match our AgentOrder interface
  const orders = data?.map((order: any) => ({
    id: order.id,
    short_id: order.short_id,
    created_at: order.created_at,
    status: order.status,
    payment_status: order.payment_status,
    total_amount: order.total_amount,
    customer_name: order.Customer?.User?.name || 'Customer',
    pickup_code: order.pickup_code,
    dropoff_code: order.dropoff_code,
    pickup_status: order.pickup_status,
    items: order.OrderItem?.map((item: any) => ({
      id: item.id,
      name: item.Product?.name,
      quantity: item.quantity,
      price: item.price_at_purchase,
    })) || [],
    isUnread: false,
  })) || [];

  return NextResponse.json({ orders });
}
