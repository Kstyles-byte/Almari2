import { NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';

// GET /api/admin/refunds - Get all refunds with filtering (admin only)
export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.set({ name, value: '', ...options });
          },
        },
      }
    );
    
    const { searchParams } = new URL(request.url);
    
    // Check for active session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: userProfile, error: profileError } = await supabase
      .from('User')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (profileError || !userProfile || userProfile.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized - Admin only' }, { status: 403 });
    }

    // Build query with all relations
    let query = supabase
      .from('RefundRequest')
      .select(`
        *,
        customer:Customer(
          *,
          user:User(*)
        ),
        vendor:Vendor(*),
        order:Order(
          *,
          orderGroup:OrderGroup(*)
        ),
        orderItem:OrderItem(
          *, 
          product:Product(*)
        ),
        return:Return(*)
      `);

    // Apply filters
    const status = searchParams.get('status');
    if (status) {
      query = query.eq('status', status);
    }

    const vendorId = searchParams.get('vendor_id');
    if (vendorId) {
      query = query.eq('vendor_id', vendorId);
    }

    const customerId = searchParams.get('customer_id');
    if (customerId) {
      query = query.eq('customer_id', customerId);
    }

    const startDate = searchParams.get('start_date');
    if (startDate) {
      query = query.gte('created_at', startDate);
    }

    const endDate = searchParams.get('end_date');
    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const minAmount = searchParams.get('min_amount');
    if (minAmount) {
      query = query.gte('refund_amount', parseFloat(minAmount));
    }

    const maxAmount = searchParams.get('max_amount');
    if (maxAmount) {
      query = query.lte('refund_amount', parseFloat(maxAmount));
    }

    // Sorting
    const sortBy = searchParams.get('sort_by') || 'created_at';
    const sortOrder = searchParams.get('sort_order') || 'desc';
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Pagination
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('page_size') || '20');
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    // Execute query with count
    const { data: refunds, error, count } = await query
      .range(from, to)
      .select('*', { count: 'exact' });

    if (error) {
      console.error('Error fetching refunds:', error);
      return NextResponse.json({ error: 'Failed to fetch refunds' }, { status: 500 });
    }

    // Get summary statistics
    const { data: stats } = await supabase
      .from('RefundRequest')
      .select(`
        status,
        refund_amount
      `);

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
      pagination: {
        page,
        pageSize,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize)
      },
      summary: {
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
