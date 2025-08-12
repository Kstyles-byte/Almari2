import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const dynamic = 'force-dynamic';

export default async function AdminAnalyticsDashboard() {
  const supabase = createServerComponentClient<Database>({ cookies });

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login');
  }

  const { data: refunds } = await supabase
    .from('RefundRequest')
    .select('status, refund_amount')
    .order('created_at', { ascending: false });

  const totalRefunds = (refunds || []).length;
  const totalAmount = (refunds || []).reduce((sum, refund) => sum + Number(refund.refund_amount), 0);

  let pendingCount = 0;
  let approvedCount = 0;
  let rejectedCount = 0;

  (refunds || []).forEach((refund) => {
    if (refund.status === 'PENDING') pendingCount++;
    if (refund.status === 'APPROVED') approvedCount++;
    if (refund.status === 'REJECTED') rejectedCount++;
  });

  return (
    <div className="container mx-auto py-6">
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-xl font-bold">Refund Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>Total Refunds: {totalRefunds}</div>
            <div>Pending Refunds: {pendingCount}</div>
            <div>Approved Refunds: {approvedCount}</div>
            <div>Rejected Refunds: {rejectedCount}</div>
            <div>Total Amount Refunded: ${totalAmount.toFixed(2)}</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
