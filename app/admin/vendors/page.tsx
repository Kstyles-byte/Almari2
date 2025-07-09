import { Suspense } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { DataTable, Column } from '@/components/ui/data-table';
import { getVendors, approveVendor, rejectVendor } from '@/actions/admin-vendors';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { redirect } from 'next/navigation';

interface SearchParams {
  page?: string;
  q?: string;
  status?: string; // 'approved' | 'pending'
}

const PAGE_SIZE = 10;

type VendorRow = {
  id: string;
  store_name: string;
  is_approved: boolean;
  created_at: string;
  User?: any;
};

function AdminVendorActions({ vendorId, isApproved }: { vendorId: string; isApproved: boolean }) {
  'use client';
  const handleApprove = async () => {
    await approveVendor(vendorId);
  };
  const handleReject = async () => {
    await rejectVendor(vendorId);
  };
  if (isApproved) return <span className="text-green-600">Approved</span>;
  return (
    <div className="flex gap-2">
      <Button size="sm" onClick={handleApprove} variant="default">
        Approve
      </Button>
      <Button size="sm" onClick={handleReject} variant="destructive">
        Reject
      </Button>
    </div>
  );
}

async function VendorsTable({ searchParams }: { searchParams: SearchParams }) {
  const page = searchParams.page ? parseInt(searchParams.page, 10) : 1;
  const search = searchParams.q ?? '';
  const status = searchParams.status ?? '';

  const { success, vendors, pagination, error } = await getVendors({
    page,
    limit: PAGE_SIZE,
    search,
    approvedFilter: status === 'approved' ? 'approved' : status === 'pending' ? 'pending' : '',
  });

  if (!success) {
    console.error('Failed to fetch vendors', error);
    redirect('/error?message=Failed to fetch vendors');
  }

  const columns: Column<VendorRow>[] = [
    { header: 'Store Name', accessor: 'store_name', sortable: true },
    {
      header: 'Owner Email',
      accessor: (row) => {
        if (!row.User) return '-';
        return Array.isArray(row.User) ? row.User[0]?.email ?? '-' : row.User.email ?? '-';
      },
      sortable: true,
    },
    { header: 'Status', accessor: (row) => (row.is_approved ? 'Approved' : 'Pending'), sortable: true },
    {
      header: 'Actions',
      accessor: (row) => <AdminVendorActions vendorId={row.id} isApproved={row.is_approved} />,
    },
  ];

  // Pagination URLs
  const prevPageUrl = page > 1 ? `?${new URLSearchParams({ ...searchParams, page: String(page - 1) }).toString()}` : null;
  const nextPageUrl =
    pagination!.totalPages > page
      ? `?${new URLSearchParams({ ...searchParams, page: String(page + 1) }).toString()}`
      : null;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Vendors</h2>
        {status === 'pending' ? (
          <Link href="?status=approved" className="text-sm text-zervia-600">
            View Approved
          </Link>
        ) : (
          <Link href="?status=pending" className="text-sm text-zervia-600">
            View Pending
          </Link>
        )}
      </div>
      <DataTable<VendorRow>
        columns={columns}
        data={(vendors ?? []) as VendorRow[]}
        pagination={{
          currentPage: pagination!.currentPage,
          totalPages: pagination!.totalPages,
          pageSize: pagination!.pageSize,
        }}
      />
      <div className="flex justify-between pt-4">
        {prevPageUrl ? (
          <Link href={prevPageUrl} className="text-zervia-600 hover:underline">
            ← Previous
          </Link>
        ) : (
          <span />
        )}
        {nextPageUrl && (
          <Link href={nextPageUrl} className="text-zervia-600 hover:underline">
            Next →
          </Link>
        )}
      </div>
    </div>
  );
}

export default async function VendorsPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <AdminLayout>
      <Suspense fallback={<div>Loading vendors...</div>}>
        <VendorsTable searchParams={searchParams} />
      </Suspense>
    </AdminLayout>
  );
} 