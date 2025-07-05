import { getAgentOrderById } from '@/actions/agent-dashboard';
import Link from 'next/link';
import VerifyPickupForm from '@/components/agent/VerifyPickupForm';
import AcceptDropoffForm from '@/components/agent/AcceptDropoffForm';

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
      <Link href="/agent/orders" className="text-sm text-zervia-600 hover:underline">← Back to orders</Link>

      <h2 className="text-xl font-semibold">Order #{order.id.substring(0, 8)}</h2>

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
        <VerifyPickupForm orderId={order.id} />
      )}
    </div>
  );
} 