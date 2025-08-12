import { NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';

// GET /api/refunds/[id] - Get a specific refund request
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    // Fetch refund request with all relations
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
      .eq('id', params.id);

    // Apply role-based access control
    if (userProfile.role === 'CUSTOMER' && userProfile.Customer?.[0]) {
      query = query.eq('customer_id', userProfile.Customer[0].id);
    } else if (userProfile.role === 'VENDOR' && userProfile.Vendor?.[0]) {
      query = query.eq('vendor_id', userProfile.Vendor[0].id);
    } else if (userProfile.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { data: refund, error } = await query.single();

    if (error || !refund) {
      return NextResponse.json({ error: 'Refund request not found' }, { status: 404 });
    }

    return NextResponse.json({ refund });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/refunds/[id] - Update refund request (approve/reject)
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
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
    const body = await request.json();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user profile with role
    const { data: userProfile, error: profileError } = await supabase
      .from('User')
      .select('*, Vendor(*)')
      .eq('id', user.id)
      .single();

    if (profileError || !userProfile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // Only vendors and admins can update refund requests
    if (userProfile.role !== 'VENDOR' && userProfile.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get the refund request
    const { data: refund, error: refundError } = await supabase
      .from('RefundRequest')
      .select('*, vendor_id, orderItem:OrderItem(*, vendor_id)')
      .eq('id', params.id)
      .single();

    if (refundError || !refund) {
      return NextResponse.json({ error: 'Refund request not found' }, { status: 404 });
    }

    // Vendors can only update their own refunds
    if (userProfile.role === 'VENDOR' && userProfile.Vendor?.[0]) {
      if (refund.vendor_id !== userProfile.Vendor[0].id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
    }

    const { action, vendor_response, admin_notes } = body;

    // Validate action
    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Check if refund is in a valid state for update
    if (refund.status !== 'PENDING') {
      return NextResponse.json({ error: 'Refund request is no longer pending' }, { status: 400 });
    }

    const updates: any = {
      status: action === 'approve' ? 'APPROVED' : 'REJECTED',
      updated_at: new Date().toISOString()
    };

    if (userProfile.role === 'VENDOR' && vendor_response) {
      updates.vendor_response = vendor_response;
    }

    if (userProfile.role === 'ADMIN' && admin_notes) {
      updates.admin_notes = admin_notes;
    }

    // Update refund request
    const { data: updatedRefund, error: updateError } = await supabase
      .from('RefundRequest')
      .update(updates)
      .eq('id', params.id)
      .select(`
        *,
        customer:Customer(*),
        vendor:Vendor(*),
        order:Order(*),
        orderItem:OrderItem(*, product:Product(*)),
        return:Return(*)
      `)
      .single();

    if (updateError) {
      console.error('Error updating refund request:', updateError);
      return NextResponse.json({ error: 'Failed to update refund request' }, { status: 500 });
    }

    // Update the associated Return record
    const returnUpdates: any = {
      status: action === 'approve' ? 'APPROVED' : 'REJECTED',
      vendor_decision: action === 'approve' ? 'Approved' : 'Rejected',
      vendor_decision_date: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (userProfile.role === 'ADMIN') {
      returnUpdates.admin_override = true;
      returnUpdates.admin_override_reason = admin_notes;
    }

    await supabase
      .from('Return')
      .update(returnUpdates)
      .eq('id', refund.return_id);

    // If approved, update vendor's refund statistics
    if (action === 'approve') {
      const { data: vendor } = await supabase
        .from('Vendor')
        .select('total_refunds_processed, total_refund_amount')
        .eq('id', refund.vendor_id)
        .single();

      if (vendor) {
        await supabase
          .from('Vendor')
          .update({
            total_refunds_processed: (vendor.total_refunds_processed || 0) + 1,
            total_refund_amount: (vendor.total_refund_amount || 0) + refund.refund_amount
          })
          .eq('id', refund.vendor_id);
      }

      // Create or update payout hold
      const { data: existingHold } = await supabase
        .from('PayoutHold')
        .select('*')
        .eq('vendor_id', refund.vendor_id)
        .eq('status', 'ACTIVE')
        .single();

      if (existingHold) {
        // Update existing hold
        await supabase
          .from('PayoutHold')
          .update({
            hold_amount: existingHold.hold_amount + refund.refund_amount,
            refund_request_ids: [...(existingHold.refund_request_ids || []), params.id]
          })
          .eq('id', existingHold.id);
      } else {
        // Create new hold
        await supabase
          .from('PayoutHold')
          .insert({
            vendor_id: refund.vendor_id,
            hold_amount: refund.refund_amount,
            reason: 'Pending refund processing',
            refund_request_ids: [params.id],
            created_by: user.id
          });
      }
    }

    return NextResponse.json({ refund: updatedRefund });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
