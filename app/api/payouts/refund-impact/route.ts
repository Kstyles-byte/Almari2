import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';

export async function GET(request: NextRequest) {
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
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: any) {
            cookieStore.set({ name, value: '', ...options });
          },
        },
      }
    );

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: userData } = await supabase
      .from('User')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userData?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get all vendors with pending refunds
    const { data: pendingRefunds } = await supabase
      .from('RefundRequest')
      .select(`
        *,
        vendor:Vendor(id, storeName),
        orderItem:OrderItem(price_at_purchase, quantity)
      `)
      .eq('status', 'PENDING');

    // Calculate refund impact by vendor
    const vendorImpact = pendingRefunds?.reduce((acc, refund) => {
      const vendorId = refund.vendor.id;
      const refundAmount = Number(refund.refund_amount);

      if (!acc[vendorId]) {
        acc[vendorId] = {
          vendorId,
          vendorName: refund.vendor.storeName,
          totalPendingRefunds: 0,
          refundCount: 0,
          refunds: [],
        };
      }

      acc[vendorId].totalPendingRefunds += refundAmount;
      acc[vendorId].refundCount += 1;
      acc[vendorId].refunds.push({
        id: refund.id,
        amount: refundAmount,
        createdAt: refund.created_at,
      });

      return acc;
    }, {} as Record<string, any>);

    // Get vendor payouts to calculate available balance
    const vendorIds = Object.keys(vendorImpact || {});
    const { data: vendors } = await supabase
      .from('Vendor')
      .select('id, storeName, totalEarnings, availableBalance')
      .in('id', vendorIds);

    // Combine vendor balance with refund impact
    const impact = vendors?.map((vendor) => ({
      ...vendor,
      pendingRefunds: vendorImpact[vendor.id] || {
        totalPendingRefunds: 0,
        refundCount: 0,
        refunds: [],
      },
      balanceAfterRefunds: Number(vendor.availableBalance) - (vendorImpact[vendor.id]?.totalPendingRefunds || 0),
    }));

    return NextResponse.json({ impact, vendorImpact });
  } catch (error) {
    console.error('Error calculating refund impact:', error);
    return NextResponse.json(
      { error: 'Failed to calculate refund impact' },
      { status: 500 }
    );
  }
}
