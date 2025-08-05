import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';

// GET /api/payout-holds - Get payout holds
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
      .select('*, Vendor(*)')
      .eq('id', user.id)
      .single();

    if (profileError || !userProfile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // Only vendors and admins can view payout holds
    if (userProfile.role !== 'VENDOR' && userProfile.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    let query = supabase
      .from('PayoutHold')
      .select(`
        *,
        vendor:Vendor(*),
        payout:Payout(*),
        created_by_user:User(*)
      `);

    // Vendors can only see their own holds
    if (userProfile.role === 'VENDOR' && userProfile.Vendor?.[0]) {
      query = query.eq('vendor_id', userProfile.Vendor[0].id);
    }

    // Apply vendor filter if provided (for admins)
    const vendorId = searchParams.get('vendor_id');
    if (vendorId && userProfile.role === 'ADMIN') {
      query = query.eq('vendor_id', vendorId);
    }

    // Apply status filter
    const status = searchParams.get('status');
    if (status) {
      query = query.eq('status', status);
    }

    // Execute query with ordering
    const { data: holds, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching payout holds:', error);
      return NextResponse.json({ error: 'Failed to fetch payout holds' }, { status: 500 });
    }

    return NextResponse.json({ holds });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/payout-holds - Create a new payout hold (admin only)
export async function POST(request: Request) {
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

    const { vendor_id, hold_amount, reason, refund_request_ids } = body;

    // Validate vendor exists
    const { data: vendor, error: vendorError } = await supabase
      .from('Vendor')
      .select('id')
      .eq('id', vendor_id)
      .single();

    if (vendorError || !vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    // Create payout hold
    const { data: hold, error: holdError } = await supabase
      .from('PayoutHold')
      .insert({
        vendor_id,
        hold_amount,
        reason,
        refund_request_ids,
        created_by: user.id
      })
      .select(`
        *,
        vendor:Vendor(*),
        created_by_user:User(*)
      `)
      .single();

    if (holdError) {
      console.error('Error creating payout hold:', holdError);
      return NextResponse.json({ error: 'Failed to create payout hold' }, { status: 500 });
    }

    return NextResponse.json({ hold });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/payout-holds/[id]/release - Release a payout hold
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
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

    // Get the hold
    const { data: hold, error: holdError } = await supabase
      .from('PayoutHold')
      .select('*')
      .eq('id', params.id)
      .single();

    if (holdError || !hold) {
      return NextResponse.json({ error: 'Payout hold not found' }, { status: 404 });
    }

    if (hold.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Hold is not active' }, { status: 400 });
    }

    // Release the hold
    const { data: updatedHold, error: updateError } = await supabase
      .from('PayoutHold')
      .update({
        status: 'RELEASED',
        released_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .select(`
        *,
        vendor:Vendor(*),
        created_by_user:User(*)
      `)
      .single();

    if (updateError) {
      console.error('Error releasing hold:', updateError);
      return NextResponse.json({ error: 'Failed to release hold' }, { status: 500 });
    }

    return NextResponse.json({ hold: updatedHold });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
