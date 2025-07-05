'use client';

import Link from 'next/link';

interface Props {
  orders?: Array<{
    id: string;
    total?: number;
    total_amount?: number;
    status?: string;
    dropoff_code?: string | null;
    pickup_code?: string | null;
  }>;
}

export default function OrderList({ orders = [] }: Props) {
  if (orders.length === 0) {
    return (
      <div className="bg-white p-4 rounded-md shadow">
        <p className="text-sm text-gray-500">No orders.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-md shadow overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-2 text-left font-medium text-gray-600">Order</th>
            <th className="px-4 py-2 text-left font-medium text-gray-600">Drop-off Code</th>
            <th className="px-4 py-2 text-left font-medium text-gray-600">Pickup Code</th>
            <th className="px-4 py-2 text-left font-medium text-gray-600">Status</th>
            <th className="px-4 py-2 text-left font-medium text-gray-600">Total</th>
            <th className="px-4 py-2" />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {orders.map((o) => (
            <tr key={o.id} className="hover:bg-gray-50">
              <td className="px-4 py-2 whitespace-nowrap">{o.id.substring(0, 8)}</td>
              <td className="px-4 py-2 whitespace-nowrap">{o.dropoff_code ?? '-'}</td>
              <td className="px-4 py-2 whitespace-nowrap">{o.pickup_code ?? '-'}</td>
              <td className="px-4 py-2 whitespace-nowrap">{o.status}</td>
              <td className="px-4 py-2 whitespace-nowrap">₦{o.total_amount ?? o.total}</td>
              <td className="px-4 py-2 whitespace-nowrap text-right">
                <Link href={`/agent/orders/${o.id}`} className="text-zervia-600 hover:underline">
                  View
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 