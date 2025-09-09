export const dynamic = 'force-dynamic';

import { getAgentOrderById } from '@/actions/agent-dashboard';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { BackButtonHeader } from '@/components/ui/back-button';
import VerifyPickupForm from '@/components/agent/VerifyPickupForm';
import AcceptDropoffForm from '@/components/agent/AcceptDropoffForm';
import MarkReadyButton from '@/components/agent/MarkReadyButton';

interface Props {
  params: { id: string };
}

export default async function AgentOrderDetailPage({ params }: Props & { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { success, data: order, error } = await getAgentOrderById(id);

  if (!success || !order) {
    return <p className="text-red-600">{error ?? 'Order not found'}</p>;
  }

  return (
    <div className="space-y-6">
      <BackButtonHeader
        title={`Order #${order.id.substring(0, 8)}`}
        href="/agent/orders"
        backLabel="Back to Orders"
      />

      {/* Print label - hide for pending pickup status */}
      {order.pickup_status !== 'PENDING' && (
        <div>
          <Button asChild variant="outline">
            <Link href={`/agent/dropoff-label/${order.id}`}>Print Drop-off Label</Link>
          </Button>
        </div>
      )}

      <div className="bg-white rounded-md shadow divide-y">
        <div className="p-4 grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="font-medium">Status</p>
            <p>{order.status}</p>
          </div>
          <div>
            <p className="font-medium">Pickup Status</p>
            <p>{order.pickup_status}</p>
          </div>
          <div>
            <p className="font-medium">Total</p>
            <p>₦{order.total_amount}</p>
          </div>
          <div>
            <p className="font-medium">Payment Status</p>
            <p>{order.payment_status}</p>
          </div>
          <div>
            <p className="font-medium">Drop-off Code</p>
            <p>{order.dropoff_code ?? '-'}</p>
          </div>
          <div>
            <p className="font-medium">Pickup Code</p>
            <p>{order.pickup_code ?? '-'}</p>
          </div>
        </div>

        {/* Customer Information */}
        {order.customer && (
          <div className="p-4">
            <h3 className="font-medium mb-2">Customer Information</h3>
            <div className="text-sm space-y-1">
              <p><span className="font-medium">Name:</span> {order.customer.user?.name || 'N/A'}</p>
              <p><span className="font-medium">Email:</span> {order.customer.user?.email || 'N/A'}</p>
              <p><span className="font-medium">WhatsApp:</span> {order.customer.phone_number || 'No WhatsApp number provided'}</p>
            </div>
          </div>
        )}

        {/* Items */}
        <div className="p-4">
          <h3 className="font-medium mb-2">Items</h3>
          <ul className="divide-y">
            {order.OrderItem?.map((item: any) => (
              <li key={item.id} className="py-2 flex justify-between text-sm">
                <span>{item.Product?.name}</span>
                <span>x {item.quantity}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Forms */}
      {order.status === 'PROCESSING' && order.pickup_status === 'PENDING' && (
        <AcceptDropoffForm orderId={order.id} />
      )}

      {order.pickup_status === 'READY_FOR_PICKUP' && (
        <VerifyPickupForm orderId={order.id} pickupCode={order.pickup_code} />
      )}

      {order.status === 'DROPPED_OFF' && order.pickup_status === 'PENDING' && (
        <MarkReadyButton orderId={order.id} />
      )}
    </div>
  );
} 