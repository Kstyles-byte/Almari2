import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';

// PUT /api/admin/refunds/:id/override - Override vendor decision (admin only)
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    const body = await request.json();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: userProfile, error: profileError } = await supabase
      .from('User')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !userProfile || userProfile.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized - Admin only' }, { status: 403 });
    }

    // Get the refund request
    const { data: refund, error: refundError } = await supabase
      .from('RefundRequest')
      .select('*')
      .eq('id', params.id)
      .single();

    if (refundError || !refund) {
      return NextResponse.json({ error: 'Refund request not found' }, { status: 404 });
    }

    const { action, admin_notes } = body;

    // Validate action
    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Check if refund is in a valid state for override
    if (refund.status === 'APPROVED' && action === 'approve') {
      return NextResponse.json({ error: 'Refund already approved' }, { status: 400 });
    }
    if (refund.status === 'REJECTED' && action === 'reject') {
      return NextResponse.json({ error: 'Refund already rejected' }, { status: 400 });
    }

    const updates: any = {
      status: action === 'approve' ? 'APPROVED' : 'REJECTED',
      admin_notes,
      updated_at: new Date().toISOString()
    };

    // Update refund request
    const { data: updatedRefund, error: updateError } = await supabase
      .from('RefundRequest')
      .update(updates)
      .eq('id', params.id)
      .select('*')
      .single();

    if (updateError) {
      console.error('Error updating refund request:', updateError);
      return NextResponse.json({ error: 'Failed to update refund request' }, { status: 500 });
    }

    // If overridden to approved, handle payout hold
    if (action === 'approve') {
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
            reason: 'Pending refund processing after admin override',
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
