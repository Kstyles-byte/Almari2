"use client";

import { useAtom } from 'jotai';
import Link from 'next/link';
import React, { useEffect } from 'react';
import { vendorOrdersAtom, VendorOrder, unreadVendorOrdersCountAtom } from '@/lib/atoms';

export default function VendorOrdersTable() {
  const [orders, setOrders] = useAtom(vendorOrdersAtom);
  const [, setUnreadCount] = useAtom(unreadVendorOrdersCountAtom);

  // Mark all orders as read when page mounts
  useEffect(() => {
    // find unread count and set orders isUnread false
    let unread = 0;
    const updated = orders.map((o) => {
      if (o.isUnread) unread += 1;
      return { ...o, isUnread: false, isNew: false };
    });
    if (unread > 0) {
      setOrders(updated);
      setUnreadCount((c) => Math.max(c - unread, 0));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!orders.length) {
    return (
      <div className="bg-white p-12 rounded-lg shadow-sm border border-gray-100 text-center">
        <div className="mx-auto h-12 w-12 text-gray-400">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No orders</h3>
        <p className="mt-1 text-sm text-gray-500">You haven't received any orders yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {orders.map((order) => (
        <OrderCard key={order.id} order={order} />
      ))}
    </div>
  );
}

function OrderCard({ order }: { order: VendorOrder }) {
  return (
    <div
      className={
        `bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden ` +
        (order.isNew ? 'animate-pulse border-green-400' : '')
      }
    >
      <div className="px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row justify-between">
        <div className="mb-2 sm:mb-0">
          <div className="flex items-center">
            <Link href={`/vendor/orders/${order.id}`} className="text-md font-medium text-zervia-600 hover:text-zervia-900">
              Order #{order.orderNumber}
            </Link>
            <span
              className={`ml-3 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                order.status === 'PENDING'
                  ? 'bg-yellow-100 text-yellow-800'
                  : order.status === 'DELIVERED'
                  ? 'bg-green-100 text-green-800'
                  : order.status === 'CANCELLED'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-blue-100 text-blue-800'
              }`}
            >
              {order.status}
            </span>
            {order.isNew && (
              <span className="ml-2 text-xs bg-green-500 text-white rounded-full px-2 py-0.5">NEW</span>
            )}
          </div>
          <div className="text-sm text-gray-500 mt-1">
            Placed on {new Date(order.createdAt).toLocaleDateString()}
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <div className="text-sm text-gray-500">Customer</div>
            <div className="text-sm font-medium text-gray-900">{order.customerName}</div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Payment</div>
            <div
              className={`text-sm font-medium ${
                order.paymentStatus === 'COMPLETED'
                  ? 'text-green-600'
                  : order.paymentStatus === 'FAILED'
                  ? 'text-red-600'
                  : 'text-yellow-600'
              }`}
            >
              {order.paymentStatus}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Amount</div>
            <div className="text-sm font-medium text-gray-900">₦{order.totalAmount.toLocaleString()}</div>
          </div>
        </div>
      </div>
    </div>
  );
} 