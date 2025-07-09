'use client';

import React from 'react';
import { DataTable, Column } from '@/components/ui/data-table';
import { updateOrderStatus } from '@/actions/admin-orders';

export type OrderRow = {
  id: string;
  total_amount: number;
  status: string;
  payment_status: string;
  created_at: string;
  customer_id: string;
};

interface Pagination {
  currentPage: number;
  totalPages: number;
  pageSize: number;
}

interface Props {
  orders: OrderRow[];
  pagination: Pagination;
  prevPageUrl: string | null;
  nextPageUrl: string | null;
}

function StatusSelect({ id, value }: { id: string; value: string }) {
  const [pending, setPending] = React.useState(false);
  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value as OrderRow['status'];
    setPending(true);
    await updateOrderStatus(id, newStatus as any);
    setPending(false);
  };
  return (
    <select
      className="border rounded px-2 py-1 text-sm"
      value={value}
      disabled={pending}
      onChange={handleChange}
    >
      <option value="PENDING">Pending</option>
      <option value="PROCESSING">Processing</option>
      <option value="SHIPPED">Shipped</option>
      <option value="READY_FOR_PICKUP">Ready for Pickup</option>
      <option value="DELIVERED">Delivered</option>
      <option value="CANCELLED">Cancelled</option>
    </select>
  );
}

export default function OrdersTableClient({ orders, pagination, prevPageUrl, nextPageUrl }: Props) {
  const columns: Column<OrderRow>[] = [
    { header: 'Order ID', accessor: 'id' },
    { header: 'Customer ID', accessor: 'customer_id' },
    {
      header: 'Total',
      accessor: (row) => `₦${row.total_amount.toLocaleString()}`,
      sortable: true,
    },
    { header: 'Payment', accessor: 'payment_status', sortable: true },
    {
      header: 'Status',
      accessor: (row) => <StatusSelect id={row.id} value={row.status} />,
    },
    {
      header: 'Created',
      accessor: (row) => new Date(row.created_at).toLocaleDateString(),
      sortable: true,
    },
  ];

  return (
    <div className="space-y-6">
      <DataTable<OrderRow> columns={columns} data={orders} pagination={pagination} />

      <div className="flex justify-between pt-4">
        {prevPageUrl ? (
          <a href={prevPageUrl} className="text-zervia-600 hover:underline">
            ← Previous
          </a>
        ) : (
          <span />
        )}
        {nextPageUrl && (
          <a href={nextPageUrl} className="text-zervia-600 hover:underline">
            Next →
          </a>
        )}
      </div>
    </div>
  );
} 