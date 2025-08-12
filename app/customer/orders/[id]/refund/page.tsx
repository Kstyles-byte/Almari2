import { redirect } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import RefundRequestForm from '@/components/refunds/RefundRequestForm';
import { Database } from '@/types/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface RefundRequestPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function CustomerRefundRequestPage({ params }: RefundRequestPageProps) {
  const { id: orderId } = await params;
  
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
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.log('CustomerRefundRequestPage: No user session, redirecting to login.');
      redirect('/login?callbackUrl=/customer/orders/' + orderId);
    }

    // Get customer profile
    const { data: customer, error: customerError } = await supabase
      .from('Customer')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (customerError || !customer) {
      console.log('CustomerRefundRequestPage: No customer profile found, redirecting to dashboard.');
      redirect('/customer/dashboard');
    }

    // Get order details with proper error handling
    const { data: order, error: orderError } = await supabase
      .from('Order')
      .select('*')
      .eq('id', orderId)
      .eq('customer_id', customer.id)
      .single();

    if (orderError || !order) {
      console.log('CustomerRefundRequestPage: Order not found or access denied:', orderError);
      redirect('/customer/orders');
    }

    // Check if order is eligible for refund (check both cases)
    const validStatuses = ['delivered', 'DELIVERED', 'Delivered'];
    const isDelivered = validStatuses.includes(order.status);
    
    if (!isDelivered) {
      console.log('CustomerRefundRequestPage: Order not delivered, status:', order.status);
      redirect(`/customer/orders/${orderId}`);
    }

    // Fetch order items separately with proper error handling
    const { data: orderItems, error: itemsError } = await supabase
      .from('OrderItem')
      .select(`
        id,
        quantity,
        price_at_purchase,
        product:Product(id, name, slug, price),
        vendor:Vendor(id, store_name)
      `)
      .eq('order_id', orderId);

    if (itemsError) {
      console.log('CustomerRefundRequestPage: Error fetching order items:', itemsError);
    }

    return (
      <div className="container mx-auto py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Request Refund</CardTitle>
            <CardDescription>
              Select the items you want to refund from order #{order.id.slice(0, 8)}
            </CardDescription>
          </CardHeader>
          <CardContent>

            
            {/* Render a RefundRequestForm per item */}
            {Array.isArray(orderItems) && orderItems.length > 0 ? (
              orderItems.map((item: any) => (
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
    );
    
  } catch (error: any) {
    // Handle potential errors, including redirect errors
    if (typeof error?.digest === 'string' && error.digest.startsWith('NEXT_REDIRECT')) {
      throw error; // Re-throw the redirect error
    }
    // Handle other unexpected errors
    console.error('Error in CustomerRefundRequestPage:', error);
    redirect('/customer/orders?error=An+error+occurred+loading+refund+page');
  }
}