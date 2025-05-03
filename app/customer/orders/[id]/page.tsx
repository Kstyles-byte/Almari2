import { getOrderById, cancelOrder } from '@/actions/orders';
import { OrderDetail } from '@/components/customer/order-detail';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import { notFound } from 'next/navigation';
import { CancelOrderForm } from '@/components/customer/cancel-order-form';

export default async function CustomerOrderDetailPage({
  params,
}: {
  params: { id: string };
}) {
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
      
      <OrderDetail
        order={order}
        onTrackOrder={() => {}} // Will be implemented with client-side modal
        onRequestReturn={
          order.returnEligible 
            ? () => {} // Will be implemented with client-side modal
            : undefined
        }
        onWriteReview={() => {}} // Will be implemented with client-side modal
        onDownloadInvoice={() => {}} // Will be implemented with client-side functionality
      />
    </div>
  );
} 