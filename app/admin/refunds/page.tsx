import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';
import { redirect } from 'next/navigation';
import { PageWrapper } from '@/components/layout/page-wrapper';
import { AdminRefundDashboard } from '@/components/refunds/AdminRefundDashboard';

export const dynamic = 'force-dynamic';

export default async function AdminRefundOversightPage() {
  const supabase = createServerComponentClient<Database>({ cookies });

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login');
  }

  // Check if user is admin
  const { data: userProfile } = await supabase
    .from('User')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!userProfile || userProfile.role !== 'ADMIN') {
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
      vendor:Vendor(id, storeName),
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
