import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';

// GET /api/refunds - Get refund requests based on user role
export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    const { searchParams } = new URL(request.url);
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user profile with role
    const { data: userProfile, error: profileError } = await supabase
      .from('User')
      .select('*, Customer(*), Vendor(*)')
      .eq('id', user.id)
      .single();

    if (profileError || !userProfile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    let query = supabase
      .from('RefundRequest')
      .select(`
        *,
        customer:Customer(*),
        vendor:Vendor(*),
        order:Order(*),
        orderItem:OrderItem(*, product:Product(*)),
        return:Return(*)
      `);

    // Apply role-based filtering
    if (userProfile.role === 'CUSTOMER' && userProfile.Customer?.[0]) {
      query = query.eq('customer_id', userProfile.Customer[0].id);
    } else if (userProfile.role === 'VENDOR' && userProfile.Vendor?.[0]) {
      query = query.eq('vendor_id', userProfile.Vendor[0].id);
    } else if (userProfile.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Apply status filter if provided
    const status = searchParams.get('status');
    if (status) {
      query = query.eq('status', status);
    }

    // Apply date range filter if provided
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    // Execute query with ordering
    const { data: refunds, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching refunds:', error);
      return NextResponse.json({ error: 'Failed to fetch refunds' }, { status: 500 });
    }

    return NextResponse.json({ refunds });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/refunds - Create a new refund request
export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    const body = await request.json();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get customer profile
    const { data: customer, error: customerError } = await supabase
      .from('Customer')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (customerError || !customer) {
      return NextResponse.json({ error: 'Customer profile not found' }, { status: 404 });
    }

    const { order_id, order_item_id, reason, description, refund_amount, photos } = body;

    // Validate order item belongs to customer
    const { data: orderItem, error: orderItemError } = await supabase
      .from('OrderItem')
      .select(`
        *,
        order:Order!inner(*, customer_id),
        product:Product(*)
      `)
      .eq('id', order_item_id)
      .eq('order.customer_id', customer.id)
      .single();

    if (orderItemError || !orderItem) {
      return NextResponse.json({ error: 'Order item not found or unauthorized' }, { status: 404 });
    }

    // Check if order is eligible for refund (delivered within 30 days)
    const order = orderItem.order;
    if (order.status !== 'DELIVERED') {
      return NextResponse.json({ error: 'Order must be delivered to request refund' }, { status: 400 });
    }

    const deliveryDate = new Date(order.updated_at);
    const daysSinceDelivery = Math.floor((Date.now() - deliveryDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysSinceDelivery > 30) {
      return NextResponse.json({ error: 'Refund window has expired (30 days)' }, { status: 400 });
    }

    // Check if refund already exists for this order item
    const { data: existingRefund } = await supabase
      .from('RefundRequest')
      .select('id')
      .eq('order_item_id', order_item_id)
      .not('status', 'in', '("REJECTED","CANCELLED")')
      .single();

    if (existingRefund) {
      return NextResponse.json({ error: 'Refund request already exists for this item' }, { status: 400 });
    }

    // Create return record first
    const { data: returnRecord, error: returnError } = await supabase
      .from('Return')
      .insert({
        order_id: order.id,
        order_item_id,
        product_id: orderItem.product_id,
        customer_id: customer.id,
        vendor_id: orderItem.vendor_id,
        reason,
        refund_amount,
        photos
      })
      .select()
      .single();

    if (returnError) {
      console.error('Error creating return:', returnError);
      return NextResponse.json({ error: 'Failed to create return record' }, { status: 500 });
    }

    // Create refund request
    const { data: refundRequest, error: refundError } = await supabase
      .from('RefundRequest')
      .insert({
        return_id: returnRecord.id,
        customer_id: customer.id,
        vendor_id: orderItem.vendor_id,
        order_id: order.id,
        order_item_id,
        reason,
        description,
        refund_amount,
        photos
      })
      .select(`
        *,
        customer:Customer(*),
        vendor:Vendor(*),
        order:Order(*),
        orderItem:OrderItem(*, product:Product(*)),
        return:Return(*)
      `)
      .single();

    if (refundError) {
      console.error('Error creating refund request:', refundError);
      return NextResponse.json({ error: 'Failed to create refund request' }, { status: 500 });
    }

    return NextResponse.json({ refund: refundRequest });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
