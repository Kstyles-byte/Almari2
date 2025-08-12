import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';
import { redirect } from 'next/navigation';
import { PageWrapper } from '@/components/layout/page-wrapper';
import { RefundTrackingList } from '@/components/refunds/RefundTrackingList';

export const dynamic = 'force-dynamic';

export default async function CustomerRefundTrackingPage() {
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
    redirect('/login');
  }

  const { data: customer } = await supabase
    .from('Customer')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (!customer) {
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
        product:Product(name, slug)
      ),
      vendor:Vendor(id, storeName),
      return:Return(status, vendor_decision_date)
    `)
    .eq('customer_id', customer.id)
    .order('created_at', { ascending: false });

  return (
    <PageWrapper>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Your Refunds</h1>
            <p className="text-muted-foreground">
              Track the status of your refund requests
            </p>
          </div>
        </div>
        
        <RefundTrackingList refunds={refunds || []} />
      </div>
    </PageWrapper>
  );
}
