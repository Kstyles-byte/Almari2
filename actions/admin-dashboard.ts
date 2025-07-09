import { createSupabaseServerActionClient } from '@/lib/supabase/action';

interface DashboardStats {
  userCount: number;
  orderCount: number;
  productCount: number;
  totalRevenue: number; // In minor currency units (e.g. kobo) for accuracy
}

/**
 * Returns basic statistics for the admin dashboard.
 * Uses the service-role key – bypasses RLS – so it should only be called from secured admin pages.
 */
export async function getDashboardStats(): Promise<{ success: true; data: DashboardStats } | { success: false; error: string }> {
  try {
    const supabase = await createSupabaseServerActionClient(false);

    // --- Users ---
    const { count: userCount, error: userErr } = await supabase
      .from('User')
      .select('*', { head: true, count: 'exact' });
    if (userErr) throw new Error(userErr.message);

    // --- Orders (paid only) ---
    const { data: orderRows, error: orderErr } = await supabase
      .from('Order')
      .select('total_amount, payment_status, status');
    if (orderErr) throw new Error(orderErr.message);

    const completedOrders = orderRows?.filter(
      (o) => o.status === 'DELIVERED'
    ) ?? [];

    const orderCount = completedOrders.length;
    const totalRevenue = completedOrders.reduce(
      (acc, cur) => acc + (cur.total_amount as number),
      0
    );

    // --- Products ---
    const { count: productCount, error: prodErr } = await supabase
      .from('Product')
      .select('*', { head: true, count: 'exact' });
    if (prodErr) throw new Error(prodErr.message);

    return {
      success: true,
      data: {
        userCount: userCount ?? 0,
        orderCount,
        productCount: productCount ?? 0,
        totalRevenue,
      },
    };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
} 