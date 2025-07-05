import { getAgentOrders } from '@/actions/agent-dashboard';
import Link from 'next/link';
import OrderSearchInput from '@/components/agent/OrderSearchInput';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams?: { [key: string]: string | string[] | undefined };
}

const filters = [
  { label: 'All', value: '' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Ready', value: 'READY_FOR_PICKUP' },
  { label: 'Picked Up', value: 'PICKED_UP' },
];

export default async function AgentOrdersPage({ searchParams }: PageProps & { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  // Next.js 15: `searchParams` is a Promise – unwrap it first
  const params = await searchParams;
  const pickupStatus = (params?.status as string) || '';
  const query = (params?.q as string) || '';

  const { success, data: orders, error } = await getAgentOrders({
    ...(pickupStatus ? { pickupStatus: pickupStatus as any } : {}),
    ...(query ? { search: query } : {}),
  });

  const buildLink = (status: string) => {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (query) params.set('q', query);
    const qs = params.toString();
    return qs ? `?${qs}` : '/agent/orders';
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        {filters.map((f) => {
          const active = pickupStatus === f.value || (!pickupStatus && f.value === '');
          return (
            <Link
              key={f.value}
              href={buildLink(f.value)}
              className={`px-4 py-2 rounded-md text-sm border transition-colors ${
                active ? 'bg-zervia-600 text-white' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {f.label}
            </Link>
          );
        })}
      </div>

      {/* Search (client-side live filtering) */}
      <div className="mt-4">
        <OrderSearchInput defaultValue={query} />
      </div>

      {/* Orders Table or Empty */}
      {!success ? (
        <p className="text-red-600">Error loading orders: {error}</p>
      ) : orders && orders.length > 0 ? (
        <>
          {/* Mobile (<=sm) – card/list layout */}
          <ul className="sm:hidden divide-y bg-white rounded-md shadow">
            {orders.map((order) => (
              <li key={order.id} className="p-4 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm">#{order.id.substring(0, 8)}</span>
                  <span className="text-xs text-gray-600">₦{order.total_amount}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Status: {order.status}</span>
                  <span>Pickup: {order.pickup_status}</span>
                </div>
                <Link
                  href={`/agent/orders/${order.id}`}
                  className="inline-block text-xs text-zervia-600 hover:underline mt-1"
                >
                  View details
                </Link>
              </li>
            ))}
          </ul>

          {/* Desktop/tablet table layout */}
          <div className="hidden sm:block bg-white shadow rounded-md overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-gray-600">Order ID</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-600">Status</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-600">Pickup Status</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-600">Total</th>
                  <th className="px-4 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 whitespace-nowrap">{order.id.substring(0, 8)}</td>
                    <td className="px-4 py-2 whitespace-nowrap">{order.status}</td>
                    <td className="px-4 py-2 whitespace-nowrap">{order.pickup_status}</td>
                    <td className="px-4 py-2 whitespace-nowrap">₦{order.total_amount}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-right">
                      <Link href={`/agent/orders/${order.id}`} className="text-zervia-600 hover:underline">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <p>No orders found.</p>
      )}
    </div>
  );
} 