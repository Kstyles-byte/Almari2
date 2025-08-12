import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';
import { redirect } from 'next/navigation';
import { PageWrapper } from '@/components/layout/page-wrapper';
import { VendorRefundDetailView } from '@/components/refunds/VendorRefundDetailView';

export const dynamic = 'force-dynamic';

export default async function VendorRefundDetailPage({ params }: { params: { id: string } }) {
  const supabase = createServerComponentClient<Database>({ cookies });

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login');
  }

  // Verify vendor
  const { data: vendor } = await supabase
    .from('Vendor')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (!vendor) {
    redirect('/vendor/dashboard');
  }

  const { data: refund, error } = await supabase
    .from('RefundRequest')
    .select(`
      *,
      customer:Customer(*, user:User(*)),
      vendor:Vendor(*),
      order:Order(*),
      orderItem:OrderItem(*, product:Product(*)),
      return:Return(*)
    `)
    .eq('id', params.id)
    .eq('vendor_id', vendor.id)
    .single();

  if (error || !refund) {
    redirect('/vendor/dashboard/refunds');
  }

  return (
    <PageWrapper>
      <VendorRefundDetailView refund={refund} />
    </PageWrapper>
  );
}
