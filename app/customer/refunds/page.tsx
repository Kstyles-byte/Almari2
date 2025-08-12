import React from 'react';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';
import { redirect } from 'next/navigation';
import { PageWrapper } from '@/components/layout/page-wrapper';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const dynamic = 'force-dynamic';

export default async function CustomerRefundTrackingPage() {
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
      console.log('CustomerRefundTrackingPage: No user session, redirecting to signin.');
      return redirect('/signin?callbackUrl=/customer/refunds');
    }

    const { data: customer } = await supabase
      .from('Customer')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!customer) {
      console.log('CustomerRefundTrackingPage: No customer profile found, redirecting to dashboard.');
      return redirect('/customer/dashboard');
    }

    const { data: refunds } = await supabase
      .from('RefundRequest')
      .select(`
        *,
        order:Order(id, created_at),
        orderItem:OrderItem(id, quantity, product:Product(name, price))
      `)
      .eq('customer_id', customer.id)
      .order('created_at', { ascending: false });

    const refundsList = refunds ?? [];

    return (
    <PageWrapper>
      <div className="space-y-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Your Refunds</h2>
        </div>
         {refundsList.length === 0 ? (
          <div className="text-muted">No refunds requested yet.</div>
        ) : (
          refundsList.map(refund => (
            <Card key={refund.id} className="max-w-xl">
              <CardHeader>
                <CardTitle>
                  Refund #{refund.id.slice(0, 8)}
                  <Badge className="ml-2" variant="outline">{refund.status}</Badge>
                </CardTitle>
              </CardHeader>
               <CardContent className="grid gap-4 p-2">
                 <div>
                   {refund.orderItem ? (
                     <div className="flex items-start space-x-2">
                       <div>
                         <p className="text-sm font-medium leading-none">{refund.orderItem.product?.name || 'Unknown Product'}</p>
                         <p className="text-sm text-muted-foreground">
                           {refund.orderItem.quantity} x ${(refund.orderItem.product?.price || 0).toFixed(2)}
                         </p>
                       </div>
                     </div>
                   ) : (
                     <p className="text-sm text-muted-foreground">No order item found</p>
                   )}
                 </div>
                <p className="text-sm">Requested: {new Date(refund.created_at).toLocaleDateString()}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </PageWrapper>
  );
    
  } catch (error: any) {
    // Catch potential errors, including redirect errors
    if (typeof error?.digest === 'string' && error.digest.startsWith('NEXT_REDIRECT')) {
      throw error; // Re-throw the redirect error
    }
    // Handle other unexpected errors
    console.error('Error in CustomerRefundTrackingPage:', error);
    // Redirect to signin in case of unexpected issues
    return redirect('/signin?callbackUrl=/customer/refunds&message=An+error+occurred+loading+the+refunds+page.');
  }
}

