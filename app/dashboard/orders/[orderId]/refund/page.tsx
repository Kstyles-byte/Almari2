import { redirect } from 'next/navigation';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import RefundRequestForm from '@/components/refunds/RefundRequestForm';
import { Database } from '@/types/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageWrapper } from '@/components/layout/page-wrapper';

interface RefundRequestPageProps {
  params: {
    orderId: string;
  };
}

export default async function RefundRequestPage({ params }: RefundRequestPageProps) {
  const supabase = createServerComponentClient<Database>({ cookies });
  
  // Get authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    redirect('/login');
  }

  // Get customer profile
  const { data: customer } = await supabase
    .from('Customer')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (!customer) {
    redirect('/dashboard');
  }

  // Get order details with items
  const { data: order, error: orderError } = await supabase
    .from('Order')
    .select(`
      *,
      orderItems:OrderItem(
        id,
        quantity,
        price_at_purchase,
        product:Product(id, name, slug, price),
        vendor:Vendor(id, store_name)
      )
    `)
    .eq('id', params.orderId)
    .eq('customer_id', customer.id)
    .single();

  if (orderError || !order) {
    redirect('/customer/orders');
  }

  // Check if order is eligible for refund
  if (order.status !== 'DELIVERED') {
    redirect(`/customer/orders/${params.orderId}`);
  }

  return (
    <PageWrapper>
      <div className="container mx-auto py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Request Refund</CardTitle>
            <CardDescription>
              Select the items you want to refund from order #{order.id.slice(0, 8)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Render a RefundRequestForm per item for now; can be improved to select items */}
            {Array.isArray(order.orderItems) && order.orderItems.length > 0 ? (
              order.orderItems.map((item: any) => (
                <div key={item.id} className="mb-6">
                  <RefundRequestForm orderItem={item} orderId={order.id} />
                </div>
              ))
            ) : (
              <div className="text-sm text-muted-foreground">No items found for this order.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageWrapper>
  );
}
