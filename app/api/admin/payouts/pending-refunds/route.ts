import { NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';

// GET /api/admin/payouts/pending-refunds - Get payouts with pending refunds (admin only)
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

    // Query payouts with pending refund holds
    const { data: payouts, error } = await supabase
      .from('Payout')
      .select(`
        *,
        vendor:Vendor(*),
        payoutHolds:PayoutHold(*)
      `)
      .eq('payoutHolds.status', 'ACTIVE')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching payouts with refund holds:', error);
      return NextResponse.json({ error: 'Failed to fetch payouts with refund holds' }, { status: 500 });
    }

    return NextResponse.json({ payouts });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
