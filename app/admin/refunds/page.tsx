import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';
import { redirect } from 'next/navigation';
import { PageWrapper } from '@/components/layout/page-wrapper';
import { AdminRefundDashboard } from '@/components/refunds/AdminRefundDashboard';

export const dynamic = 'force-dynamic';

export default async function AdminRefundOversightPage() {
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

  // Check for active session
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session?.user) {
    redirect('/login');
  }

  // Check if user is admin
  const { data: userProfile, error: profileError } = await supabase
    .from('User')
    .select('role')
    .eq('id', session.user.id)
    .single();

  if (profileError || !userProfile || userProfile.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  const { data: refunds } = await supabase
    .from('RefundRequest')
    .select(`
      *,
      order:Order(id, created_at, status),
      orderItem:OrderItem(
        id, 
        quantity, 
        price_at_purchase,
        product:Product(name)
      ),
      customer:Customer(id, user:User(name, email)),
      vendor:Vendor(id, store_name),
      return:Return(status, vendor_decision, vendor_decision_date)
    `)
    .order('created_at', { ascending: false });

  return (
    <PageWrapper>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Refund Management</h1>
            <p className="text-muted-foreground">
              Monitor and manage all refund requests across the platform
            </p>
          </div>
        </div>
        
        <AdminRefundDashboard refunds={refunds || []} />
      </div>
    </PageWrapper>
  );
}
