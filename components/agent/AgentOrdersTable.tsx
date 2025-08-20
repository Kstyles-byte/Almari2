'use client';

import { useAtom, useSetAtom } from 'jotai';
import { agentOrdersAtom, unreadAgentOrdersCountAtom } from '@/lib/atoms';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

const filters = [
  { label: 'All', value: '' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Dropped Off', value: 'DROPPED_OFF' },
  { label: 'Ready', value: 'READY_FOR_PICKUP' },
  { label: 'Picked Up', value: 'PICKED_UP' },
];

export default function AgentOrdersTable() {
  const [orders] = useAtom(agentOrdersAtom);
  const [, setUnreadCount] = useAtom(unreadAgentOrdersCountAtom);
  const setOrders = useSetAtom(agentOrdersAtom);
  const searchParams = useSearchParams();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const pickupStatus = searchParams.get('status') || '';
  const query = searchParams.get('q') || '';

  useEffect(() => {
    setSearchQuery(query);
  }, [query]);

  // Filter orders based on status and search query
  const filteredOrders = orders.filter(order => {
    // Status filter
    if (pickupStatus && order.pickup_status !== pickupStatus) {
      return false;
    }

    // Search filter
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      return (
        order.id.toLowerCase().includes(searchLower) ||
        order.short_id?.toLowerCase().includes(searchLower) ||
        order.customer_name.toLowerCase().includes(searchLower) ||
        order.pickup_code?.toLowerCase().includes(searchLower) ||
        order.dropoff_code?.toLowerCase().includes(searchLower)
      );
    }

    return true;
  });

  const buildLink = (status: string) => {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (searchQuery) params.set('q', searchQuery);
    const qs = params.toString();
    return qs ? `?${qs}` : '/agent/orders';
  };

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    const params = new URLSearchParams();
    if (pickupStatus) params.set('status', pickupStatus);
    if (value) params.set('q', value);
    const qs = params.toString();
    router.push(qs ? `/agent/orders?${qs}` : '/agent/orders');
  };

  const markAsRead = (orderId: string) => {
    setOrders(prevOrders => {
      const updated = prevOrders.map(o =>
        o.id === orderId ? { ...o, isUnread: false } : o
      );
      return updated;
    });
    setUnreadCount(prev => Math.max(0, prev - 1));
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

      {/* Search */}
      <div className="mt-4">
        <input
          type="text"
          placeholder="Search by order ID, customer name, or codes..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-zervia-500 focus:border-transparent"
        />
      </div>

      {/* Orders Table or Empty */}
      {filteredOrders.length > 0 ? (
        <>
          {/* Mobile (<=sm) – card/list layout */}
          <ul className="sm:hidden divide-y bg-white rounded-md shadow">
            {filteredOrders.map((order) => (
              <li key={order.id} className="p-4 space-y-1 relative">
                {order.isNew && (
                  <span className="absolute top-2 right-2 px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                    New
                  </span>
                )}
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm">
                    #{order.short_id || order.id.substring(0, 8)}
                  </span>
                  <span className="text-xs text-gray-600">₦{order.total_amount}</span>
                </div>
                <div className="text-xs text-gray-500">
                  <p>Customer: {order.customer_name}</p>
                  <p>Status: {order.status}</p>
                  <p>Pickup: {order.pickup_status || 'N/A'}</p>
                  {order.pickup_code && <p>Pickup Code: {order.pickup_code}</p>}
                </div>
                <Link
                  href={`/agent/orders/${order.id}`}
                  onClick={() => markAsRead(order.id)}
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
                  <th className="px-4 py-2 text-left font-medium text-gray-600">Customer</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-600">Status</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-600">Pickup Status</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-600">Codes</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-600">Total</th>
                  <th className="px-4 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 relative">
                    <td className="px-4 py-2 whitespace-nowrap">
                      {order.short_id || order.id.substring(0, 8)}
                      {order.isNew && (
                        <span className="ml-2 px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                          New
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2">{order.customer_name}</td>
                    <td className="px-4 py-2 whitespace-nowrap">{order.status}</td>
                    <td className="px-4 py-2 whitespace-nowrap">{order.pickup_status || 'N/A'}</td>
                    <td className="px-4 py-2">
                      <div className="text-xs">
                        {order.pickup_code && <div>Pickup: {order.pickup_code}</div>}
                        {order.dropoff_code && <div>Dropoff: {order.dropoff_code}</div>}
                      </div>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">₦{order.total_amount}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-right">
                      <Link 
                        href={`/agent/orders/${order.id}`}
                        onClick={() => markAsRead(order.id)}
                        className="text-zervia-600 hover:underline"
                      >
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
        <div className="text-center py-8 bg-white rounded-md shadow">
          <p className="text-gray-500">No orders found.</p>
        </div>
      )}
    </div>
  );
}
