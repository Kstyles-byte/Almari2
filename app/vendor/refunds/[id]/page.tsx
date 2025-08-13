import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';
import { redirect } from 'next/navigation';
import { PageWrapper } from '@/components/layout/page-wrapper';
import { VendorRefundDetailView } from '@/components/refunds/VendorRefundDetailView';

export const dynamic = 'force-dynamic';

export default async function VendorRefundDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
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
      console.log('VendorRefundDetailPage: No user session, redirecting to signin.');
      return redirect('/signin?callbackUrl=/vendor/refunds/' + id);
    }

    // Get vendor profile
    const { data: vendor } = await supabase
      .from('Vendor')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!vendor) {
      console.log('VendorRefundDetailPage: No vendor profile found, redirecting to vendor dashboard.');
      return redirect('/vendor/dashboard');
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
      .eq('id', id)
      .eq('vendor_id', vendor.id)
      .single();

    if (error || !refund) {
      console.log('VendorRefundDetailPage: Refund not found, redirecting to refunds list.');
      return redirect('/vendor/refunds');
    }

    return (
      <PageWrapper>
        <VendorRefundDetailView refund={refund} />
      </PageWrapper>
    );
    
  } catch (error: any) {
    // Catch potential errors, including redirect errors
    if (typeof error?.digest === 'string' && error.digest.startsWith('NEXT_REDIRECT')) {
      throw error; // Re-throw the redirect error
    }
    // Handle other unexpected errors
    console.error('Error in VendorRefundDetailPage:', error);
    // Redirect to signin in case of unexpected issues
    return redirect('/signin?callbackUrl=/vendor/refunds/' + id + '&message=An+error+occurred+loading+the+refund+details.');
  }
}
