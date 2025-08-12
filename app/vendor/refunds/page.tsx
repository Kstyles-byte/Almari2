import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function VendorRefundsPage() {
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

    // Get authenticated user using Supabase SSR client directly
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.log('VendorRefundsPage: No user session, redirecting to signin.');
      return redirect('/signin?callbackUrl=/vendor/refunds');
    }

    // Get vendor profile
    const { data: vendor } = await supabase
      .from('Vendor')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!vendor) {
      console.log('VendorRefundsPage: No vendor profile found, redirecting to vendor dashboard.');
      return redirect('/vendor/dashboard');
    }

    // Fetch vendor refunds
    const { data: refunds } = await supabase
      .from('RefundRequest')
      .select(`
        *,
        customer:Customer(*, user:User(*)),
        order:Order(*),
        orderItem:OrderItem(*, product:Product(*)),
        return:Return(*)
      `)
      .eq('vendor_id', vendor.id)
      .order('created_at', { ascending: false });

    // Get vendor statistics
    const { data: stats } = await supabase
      .from('RefundRequest')
      .select('status, refund_amount')
      .eq('vendor_id', vendor.id);

    let totalRefunds = 0;
    let totalAmount = 0;
    let pendingCount = 0;
    let approvedCount = 0;
    let rejectedCount = 0;

    if (stats) {
      totalRefunds = stats.length;
      totalAmount = stats.reduce((sum, r) => sum + Number(r.refund_amount), 0);
      pendingCount = stats.filter(r => r.status === 'PENDING').length;
      approvedCount = stats.filter(r => r.status === 'APPROVED').length;
      rejectedCount = stats.filter(r => r.status === 'REJECTED').length;
    }

    return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Refund Management</h1>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Refunds</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRefunds}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{approvedCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalAmount.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Refunds List */}
      <div className="space-y-4">
        {refunds?.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No refunds to process.
            </CardContent>
          </Card>
        ) : (
          refunds?.map((refund) => (
            <Card key={refund.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      Refund #{refund.id.slice(0, 8)}
                      <Badge 
                        variant={
                          refund.status === 'PENDING' ? 'default' :
                          refund.status === 'APPROVED' ? 'default' :
                          'destructive'
                        }
                        className={
                          refund.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                          refund.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }
                      >
                        {refund.status}
                      </Badge>
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Customer: {refund.customer?.user?.name || 'Unknown'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Amount: ${Number(refund.refund_amount).toFixed(2)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/vendor/refunds/${refund.id}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        View Details
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p><strong>Product:</strong> {refund.orderItem?.product?.name}</p>
                  <p><strong>Reason:</strong> {refund.reason}</p>
                  {refund.description && (
                    <p><strong>Description:</strong> {refund.description}</p>
                  )}
                  <p><strong>Requested:</strong> {new Date(refund.created_at).toLocaleDateString()}</p>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
    
  } catch (error: any) {
    // Catch potential errors, including redirect errors
    if (typeof error?.digest === 'string' && error.digest.startsWith('NEXT_REDIRECT')) {
      throw error; // Re-throw the redirect error
    }
    // Handle other unexpected errors
    console.error('Error in VendorRefundsPage:', error);
    // Redirect to signin in case of unexpected issues
    return redirect('/signin?callbackUrl=/vendor/refunds&message=An+error+occurred+loading+the+refunds+page.');
  }
}
