import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';

// GET /api/refunds/customer/:customerId - Get customer refund history
export async function GET(
  request: Request,
  { params }: { params: { customerId: string } }
) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    const { searchParams } = new URL(request.url);
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify customer owns this account or is admin
    const { data: customer, error: customerError } = await supabase
      .from('Customer')
      .select('user_id')
      .eq('id', params.customerId)
      .single();

    if (customerError || !customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Check if user is the customer or admin
    const { data: userProfile } = await supabase
      .from('User')
      .select('role')
      .eq('id', user.id)
      .single();

    if (customer.user_id !== user.id && userProfile?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
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
      `)
      .eq('customer_id', params.customerId);

    // Apply status filter if provided
    const status = searchParams.get('status');
    if (status) {
      query = query.eq('status', status);
    }

    // Execute query with ordering
    const { data: refunds, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching customer refunds:', error);
      return NextResponse.json({ error: 'Failed to fetch refunds' }, { status: 500 });
    }

    return NextResponse.json({ refunds });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
