'use client';

import { useAtom } from 'jotai';
import { agentOrdersAtom, unreadAgentOrdersCountAtom } from '@/lib/atoms';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function AgentDashboard() {
  const [orders] = useAtom(agentOrdersAtom);
  const [unreadCount] = useAtom(unreadAgentOrdersCountAtom);
  const searchParams = useSearchParams();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const query = searchParams.get('q') || '';

  useEffect(() => {
    setSearchQuery(query);
  }, [query]);

  // Calculate stats
  const pending = orders.filter(o => o.pickup_status === 'PENDING').length;
  const ready = orders.filter(o => o.pickup_status === 'READY_FOR_PICKUP').length;
  const picked = orders.filter(o => o.pickup_status === 'PICKED_UP').length;

  // Filter ready orders based on search
  const readyOrders = orders.filter(order => {
    if (order.pickup_status !== 'READY_FOR_PICKUP') return false;
    
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

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    const params = new URLSearchParams();
    if (value) params.set('q', value);
    const qs = params.toString();
    router.push(qs ? `/agent/dashboard?${qs}` : '/agent/dashboard');
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Overview</h2>
        {unreadCount > 0 && (
          <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
            {unreadCount} new order{unreadCount > 1 ? 's' : ''}
          </span>
        )}
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard label="Pending Orders" value={pending} />
        <StatsCard label="Ready for Pickup" value={ready} />
        <StatsCard label="Picked Up" value={picked} />
      </div>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium">Orders Ready for Pickup</h3>
          <Link href="/agent/orders?status=READY_FOR_PICKUP" className="text-sm text-zervia-600 hover:underline">
            View all
          </Link>
        </div>

        {/* Search */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search orders..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-zervia-500 focus:border-transparent"
          />
        </div>

        {readyOrders.length === 0 ? (
          <p className="text-sm text-gray-500">No orders ready for pickup.</p>
        ) : (
          <ul className="divide-y bg-white rounded-md shadow">
            {readyOrders.slice(0, 5).map((order) => (
              <li key={order.id} className="p-4 flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">
                      Order #{order.short_id || order.id.substring(0, 6)}
                    </p>
                    {order.isNew && (
                      <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                        New
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">Customer: {order.customer_name}</p>
                  <p className="text-xs text-gray-500">Total ₦{order.total_amount}</p>
                  {order.pickup_code && (
                    <p className="text-xs text-gray-600 font-medium mt-1">
                      Pickup Code: {order.pickup_code}
                    </p>
                  )}
                </div>
                <Link href={`/agent/orders/${order.id}`} className="text-sm text-zervia-600 hover:underline">
                  Details
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Recent Orders Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium">Recent Orders</h3>
          <Link href="/agent/orders" className="text-sm text-zervia-600 hover:underline">
            View all
          </Link>
        </div>

        {orders.length === 0 ? (
          <p className="text-sm text-gray-500">No orders yet.</p>
        ) : (
          <ul className="divide-y bg-white rounded-md shadow">
            {orders.slice(0, 5).map((order) => (
              <li key={order.id} className="p-4 flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">
                      Order #{order.short_id || order.id.substring(0, 6)}
                    </p>
                    {order.isNew && (
                      <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                        New
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">Customer: {order.customer_name}</p>
                  <p className="text-xs text-gray-500">Status: {order.pickup_status || order.status}</p>
                  <p className="text-xs text-gray-500">Total ₦{order.total_amount}</p>
                </div>
                <Link href={`/agent/orders/${order.id}`} className="text-sm text-zervia-600 hover:underline">
                  Details
                </Link>
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
