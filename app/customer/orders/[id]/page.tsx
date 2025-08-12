import { getOrderById } from '@/actions/orders';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';
import { notFound } from 'next/navigation';
import { CancelOrderForm } from '@/components/customer/cancel-order-form';
import { OrderDetailWrapper } from '@/components/customer/order-detail-wrapper';
import Link from 'next/link';

export default async function CustomerOrderDetailPage(
  props: {
    params: Promise<{ id: string }>;
  }
) {
  const params = await props.params;
  // Fetch order data
  const { order, error } = await getOrderById(params.id);

  if (error || !order) {
    // If order not found, show 404
    return notFound();
  }

  // Fetch refunds for this order (server-side) using Supabase SSR client
  const cookieStore = await cookies();
  const supabase = createServerClient(
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

  const { data: refunds } = await supabase
    .from('RefundRequest')
    .select(`
      *,
      orderItem:OrderItem(id, quantity, price_at_purchase, product:Product(name))
    `)
    .eq('order_id', params.id)
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-zervia-900">Order Details</h1>
        <div className="flex gap-2">
          {/* Only show cancel button for pending/processing orders */}
          {(order.status === 'pending' || order.status === 'processing') && (
            <CancelOrderForm orderId={order.id} />
          )}
          {/* Show refund button only if eligible within window */}
          {order.status === 'delivered' && order.returnEligible && (
            <Link 
              href={`/dashboard/orders/${order.id}/refund`}
              className="bg-yellow-500 text-white px-4 py-2 rounded-md hover:bg-yellow-600 text-sm font-medium"
            >
              Request Refund
            </Link>
          )}
        </div>
      </div>
      
      <OrderDetailWrapper order={order} />

      {/* Refund history for this order */}
      {refunds && refunds.length > 0 && (
        <div className="bg-white rounded-md shadow border border-gray-100">
          <div className="px-4 py-3 border-b border-gray-100">
            <h2 className="text-lg font-semibold">Refund requests for this order</h2>
          </div>
          <div className="p-4 space-y-3">
            {refunds.map((r: any) => (
              <div key={r.id} className="flex items-center justify-between text-sm">
                <div>
                  <div className="font-medium">
                    {r.orderItem?.product?.name ?? 'Item'} — {r.reason}
                  </div>
                  <div className="text-muted-foreground">
                    Requested on {new Date(r.created_at).toLocaleDateString()} — Amount: ₦{r.refund_amount}
                  </div>
                </div>
                <div className="text-xs px-2 py-1 rounded bg-gray-100">{r.status}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Refund history link */}
      <div className="flex justify-end">
        <Link href="/customer/refunds" className="text-sm text-zervia-600 hover:underline">
          View refund requests →
        </Link>
      </div>
    </div>
  );
} 