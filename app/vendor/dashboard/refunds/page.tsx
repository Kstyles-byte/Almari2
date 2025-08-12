import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';
import { redirect } from 'next/navigation';
import { PageWrapper } from '@/components/layout/page-wrapper';
import { RefundDashboardList } from '@/components/refunds/RefundDashboardList';

export const dynamic = 'force-dynamic';

export default async function VendorRefundManagementPage() {
  const supabase = createServerComponentClient<Database>({ cookies });

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login');
  }

  const { data: vendor } = await supabase
    .from('Vendor')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (!vendor) {
    redirect('/vendor/dashboard');
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
      customer:Customer(id, user_id),
      return:Return(status, reason)
    `)
    .eq('vendor_id', vendor.id)
    .order('created_at', { ascending: false });

  return (
    <PageWrapper>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Refund Requests</h1>
            <p className="text-muted-foreground">
              Manage all refund requests here
            </p>
          </div>
        </div>
        
        <RefundDashboardList refunds={refunds || []} />
      </div>
    </PageWrapper>
  );
}
