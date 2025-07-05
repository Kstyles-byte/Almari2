import { getAgentOrders } from '@/actions/agent-dashboard';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function AgentDashboardPage() {
  const pendingRes = await getAgentOrders({ pickupStatus: 'PENDING' as any });
  const readyRes = await getAgentOrders({ pickupStatus: 'READY_FOR_PICKUP' as any });
  const pickedRes = await getAgentOrders({ pickupStatus: 'PICKED_UP' as any });

  const pending = pendingRes.data?.length ?? 0;
  const ready = readyRes.data?.length ?? 0;
  const picked = pickedRes.data?.length ?? 0;

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-semibold">Overview</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard label="Pending Orders" value={pending} />
        <StatsCard label="Ready for Pickup" value={ready} />
        <StatsCard label="Picked Up" value={picked} />
      </div>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium">Orders Ready for Pickup</h3>
          <Link href="/agent/orders" className="text-sm text-zervia-600 hover:underline">View all</Link>
        </div>
        {ready === 0 ? (
          <p className="text-sm text-gray-500">No orders ready for pickup.</p>
        ) : (
          <ul className="divide-y bg-white rounded-md shadow">
            {readyRes.data!.slice(0, 5).map((order) => (
              <li key={order.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">Order #{order.id.substring(0, 6)}</p>
                  <p className="text-xs text-gray-500">Total ₦{order.total_amount}</p>
                </div>
                <Link href={`/agent/orders/${order.id}`} className="text-sm text-zervia-600 hover:underline">Details</Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function StatsCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white p-6 rounded-md shadow text-center">
      <p className="text-2xl font-bold text-zervia-700">{value}</p>
      <p className="text-sm text-gray-600 mt-1">{label}</p>
    </div>
  );
} 