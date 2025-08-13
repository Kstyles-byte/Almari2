import { Suspense } from 'react';
import { getUsers } from '@/actions/admin-users';
import AdminLayout from '@/components/layout/AdminLayout';
import dynamic from 'next/dynamic';
// Link no longer used
import { redirect } from 'next/navigation';

interface SearchParams {
  page?: string;
  q?: string;
  role?: string;
}

const PAGE_SIZE = 10;

async function UsersTable({ searchParams }: { searchParams: SearchParams }) {
  const page = searchParams.page ? parseInt(searchParams.page, 10) : 1;
  const search = searchParams.q ?? '';
  const role = searchParams.role ?? '';

  const { success, users, pagination, error } = await getUsers({
    page,
    limit: PAGE_SIZE,
    search,
    role,
  });

  if (!success) {
    console.error('Failed to fetch users', error);
    redirect('/error?message=Failed to fetch users');
  }

  type UserRow = {
    id: string;
    name: string;
    email: string;
    role: string;
    createdAt: string;
    customerId?: string;
  };

  const rows: UserRow[] = (users ?? []).map((u: any) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    createdAt: u.created_at,
    customerId: u.customer?.id,
  }));

  const toQueryString = (params: Record<string, any>) => {
    const sp = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (typeof v === 'string' && v.length > 0) sp.set(k, v);
    });
    return sp.toString();
  };

  const prevPageUrl = page > 1 ? `?${toQueryString({ ...searchParams, page: String(page - 1) })}` : null;
  const nextPageUrl = pagination!.totalPages > page ? `?${toQueryString({ ...searchParams, page: String(page + 1) })}` : null;

  return (
    <UsersTableClient
      users={rows}
      pagination={{ currentPage: pagination!.currentPage, totalPages: pagination!.totalPages, pageSize: pagination!.pageSize }}
      prevPageUrl={prevPageUrl}
      nextPageUrl={nextPageUrl}
    />
  );
}

const UsersTableClient = dynamic(() => import('@/components/admin/users/users-table-client'));

export default async function UsersPage(props: { searchParams: Promise<SearchParams> }) {
  const searchParams = await props.searchParams;
  return (
    <AdminLayout>
      <Suspense fallback={<div>Loading users...</div>}>
        <UsersTable searchParams={searchParams} />
      </Suspense>
    </AdminLayout>
  );
} 