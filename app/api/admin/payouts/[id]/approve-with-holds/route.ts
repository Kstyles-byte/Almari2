import { NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';

// POST /api/admin/payouts/:id/approve-with-holds - Approve payout with holds (admin only)
export async function POST(
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

    // Get the payout
    const { data: payout, error: payoutError } = await supabase
      .from('Payout')
      .select('*')
      .eq('id', params.id)
      .single();

    if (payoutError || !payout) {
      return NextResponse.json({ error: 'Payout not found' }, { status: 404 });
    }

    // Calculate remaining payout
    let totalHold = 0;

    const { data: holds, error: holdError } = await supabase
      .from('PayoutHold')
      .select('hold_amount')
      .eq('vendor_id', payout.vendor_id)
      .eq('status', 'ACTIVE');

    if (holds && !holdError) {
      totalHold = holds.reduce((sum, h) => sum + Number(h.hold_amount), 0);
    }

    const remainingPayout = payout.amount - totalHold;

    if (remainingPayout <= 0) {
      return NextResponse.json({ error: 'Insufficient payout amount after holds' }, { status: 400 });
    }

    // Update the payout status
    const { data: updatedPayout, error: updateError } = await supabase
      .from('Payout')
      .update({
        status: 'APPROVED',
        amount: remainingPayout
      })
      .eq('id', params.id)
      .select('*')
      .single();

    if (updateError) {
      console.error('Error updating payout:', updateError);
      return NextResponse.json({ error: 'Failed to approve payout' }, { status: 500 });
    }

    return NextResponse.json({ payout: updatedPayout });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
