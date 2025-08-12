import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';
import { redirect } from 'next/navigation';
import { PageWrapper } from '@/components/layout/page-wrapper';
import { RefundDashboardList } from '@/components/refunds/RefundDashboardList';

export const dynamic = 'force-dynamic';

export default async function VendorRefundManagementPage() {
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
      console.log('VendorRefundManagementPage: No user session, redirecting to signin.');
      return redirect('/signin?callbackUrl=/vendor/dashboard/refunds');
    }

    // Get vendor profile
    const { data: vendor } = await supabase
      .from('Vendor')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!vendor) {
      console.log('VendorRefundManagementPage: No vendor profile found, redirecting to vendor dashboard.');
      return redirect('/vendor/dashboard');
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
    
  } catch (error: any) {
    // Catch potential errors, including redirect errors
    if (typeof error?.digest === 'string' && error.digest.startsWith('NEXT_REDIRECT')) {
      throw error; // Re-throw the redirect error
    }
    // Handle other unexpected errors
    console.error('Error in VendorRefundManagementPage:', error);
    // Redirect to signin in case of unexpected issues
    return redirect('/signin?callbackUrl=/vendor/dashboard/refunds&message=An+error+occurred+loading+the+refund+management+page.');
  }
}
