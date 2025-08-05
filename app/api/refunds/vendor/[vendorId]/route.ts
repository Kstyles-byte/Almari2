import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';

// GET /api/refunds/vendor/:vendorId - Get vendor refund requests
export async function GET(
  request: Request,
  { params }: { params: { vendorId: string } }
) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    const { searchParams } = new URL(request.url);
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify vendor owns this account or is admin
    const { data: vendor, error: vendorError } = await supabase
      .from('Vendor')
      .select('user_id')
      .eq('id', params.vendorId)
      .single();

    if (vendorError || !vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    // Check if user is the vendor or admin
    const { data: userProfile } = await supabase
      .from('User')
      .select('role')
      .eq('id', user.id)
      .single();

    if (vendor.user_id !== user.id && userProfile?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    let query = supabase
      .from('RefundRequest')
      .select(`
        *,
        customer:Customer(*, user:User(*)),
        vendor:Vendor(*),
        order:Order(*),
        orderItem:OrderItem(*, product:Product(*)),
        return:Return(*)
      `)
      .eq('vendor_id', params.vendorId);

    // Apply status filter if provided
    const status = searchParams.get('status');
    if (status) {
      query = query.eq('status', status);
    }

    // Apply date range filter
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
      console.error('Error fetching vendor refunds:', error);
      return NextResponse.json({ error: 'Failed to fetch refunds' }, { status: 500 });
    }

    // Get vendor statistics
    const { data: stats } = await supabase
      .from('RefundRequest')
      .select('status, refund_amount')
      .eq('vendor_id', params.vendorId);

    let totalRefunds = 0;
    let totalAmount = 0;
    let statusCounts: Record<string, number> = {};

    if (stats) {
      totalRefunds = stats.length;
      totalAmount = stats.reduce((sum, r) => sum + Number(r.refund_amount), 0);
      
      stats.forEach(r => {
        statusCounts[r.status] = (statusCounts[r.status] || 0) + 1;
      });
    }

    return NextResponse.json({ 
      refunds,
      statistics: {
        totalRefunds,
        totalAmount,
        statusCounts
      }
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
