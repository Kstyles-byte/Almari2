import { Suspense } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { getOrders } from '@/actions/admin-orders';
import dynamic from 'next/dynamic';
import { redirect } from 'next/navigation';

interface SearchParams {
  page?: string;
  q?: string;
  status?: string;
  payment?: string;
}

const PAGE_SIZE = 10;

type OrderRow = {
  id: string;
  total_amount: number;
  status: string;
  payment_status: string;
  created_at: string;
  customer_id: string;
};

const OrdersTableClient = dynamic(() => import('@/components/admin/orders/orders-table-client'));

async function OrdersTable({ searchParams }: { searchParams: SearchParams }) {
  const page = searchParams.page ? parseInt(searchParams.page, 10) : 1;
  const search = searchParams.q ?? '';
  const status = searchParams.status ?? '';
  const payment = searchParams.payment ?? '';

  const { success, orders, pagination, error } = await getOrders({
    page,
    limit: PAGE_SIZE,
    search,
    status,
    paymentStatus: payment,
  });

  if (!success) {
    console.error('Failed to fetch orders', error);
    redirect('/error?message=Failed to fetch orders');
  }

  // Utility to safely serialise search params (filtering out Symbol keys)
  const toQueryString = (params: Record<string, any>) => {
    const sp = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (typeof v === 'string' && v.length > 0) sp.set(k, v);
    });
    return sp.toString();
  };

  const rows: OrderRow[] = (orders ?? []).map((o: any) => ({
    id: o.id,
    total_amount: o.total_amount,
    status: o.status,
    payment_status: o.payment_status,
    created_at: o.created_at,
    customer_id: o.customer_id,
  }));

  const prevPageUrl = page > 1 ? `?${toQueryString({ ...searchParams, page: String(page - 1) })}` : null;
  const nextPageUrl = pagination!.totalPages > page ? `?${toQueryString({ ...searchParams, page: String(page + 1) })}` : null;

  return (
    <OrdersTableClient
      orders={rows}
      pagination={{ currentPage: pagination!.currentPage, totalPages: pagination!.totalPages, pageSize: pagination!.pageSize }}
      prevPageUrl={prevPageUrl}
      nextPageUrl={nextPageUrl}
    />
  );
}

export default async function OrdersPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <AdminLayout>
      <Suspense fallback={<div>Loading orders...</div>}>
        <OrdersTable searchParams={searchParams} />
      </Suspense>
    </AdminLayout>
  );
} 