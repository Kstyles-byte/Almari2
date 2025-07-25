import { createSupabaseServerActionClient } from '@/lib/supabase/action';
import { createClient } from '@supabase/supabase-js';

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
    // For dashboard stats we want *system-level* access (service-role key)
    // and we explicitly *avoid* attaching user cookies/session so that the
    // request is executed with the service role and bypasses any RLS rules
    // that might reference auth.uid(), which previously caused an
    // "infinite recursion detected in policy" error on the Order table.
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );

    // NOTE: If you later need a client that *does* respect the current user
    // session inside a server action, continue using
    // `createSupabaseServerActionClient()`. This override is only for admin
    // dashboard metrics.

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
      (o: any) => o.status === 'DELIVERED'
    ) ?? [];

    const orderCount = completedOrders.length;
    const totalRevenue = completedOrders.reduce(
      (acc: number, cur: any) => acc + (cur.total_amount as number),
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