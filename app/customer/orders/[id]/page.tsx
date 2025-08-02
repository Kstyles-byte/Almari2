import { getOrderById, cancelOrder } from '@/actions/orders';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import { notFound } from 'next/navigation';
import { CancelOrderForm } from '@/components/customer/cancel-order-form';
import { OrderDetailWrapper } from '@/components/customer/order-detail-wrapper';

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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-zervia-900">Order Details</h1>
        {/* Only show cancel button for pending/processing orders */}
        {(order.status === 'pending' || order.status === 'processing') && (
          <CancelOrderForm orderId={order.id} />
        )}
      </div>
      
      <OrderDetailWrapper order={order} />
    </div>
  );
} 