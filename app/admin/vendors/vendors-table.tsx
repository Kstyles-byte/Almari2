'use client';

import { DataTable, Column } from '@/components/ui/data-table';
import { VendorActions } from '@/components/admin/vendors/vendor-actions';
import Link from 'next/link';

interface SearchParams {
  page?: string;
  q?: string;
  status?: string;
}

type VendorRow = {
  id: string;
  store_name: string;
  is_approved: boolean;
  created_at: string;
  User?: any;
  ownerEmail?: string;
  whatsapp_phone?: string;
  statusText?: string;
  actionText?: string;
};

export function VendorsTable({ vendors, pagination, searchParams }: { vendors: VendorRow[], pagination: any, searchParams: SearchParams }) {

  const columns: Column<VendorRow>[] = [
    { header: 'Store Name', accessor: 'store_name', sortable: true },
    { header: 'Owner Email', accessor: 'ownerEmail', sortable: true },
    { header: 'WhatsApp Phone', accessor: 'whatsapp_phone', sortable: true },
    {
      header: 'Status',
      accessor: 'statusText',
      sortable: true,
      Cell: (vendor) => (
        <span
          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
            vendor.is_approved
              ? 'bg-green-100 text-green-800'
              : 'bg-yellow-100 text-yellow-800'
          }`}
        >
          {vendor.is_approved ? 'Approved' : 'Pending'}
        </span>
      ),
    },
    {
      header: 'Actions',
      accessor: 'id',
      Cell: (vendor) => (
        <VendorActions
          vendorId={vendor.id}
          isApproved={vendor.is_approved}
          storeName={vendor.store_name}
        />
      ),
    },
  ];

  const page = searchParams.page ? parseInt(searchParams.page, 10) : 1;

  const prevPageUrl = page > 1 ? `?${new URLSearchParams({ ...searchParams, page: String(page - 1) }).toString()}` : null;
  const nextPageUrl =
    pagination!.totalPages > page
      ? `?${new URLSearchParams({ ...searchParams, page: String(page + 1) }).toString()}`
      : null;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Vendors</h2>
        {searchParams.status === 'pending' ? (
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
        data={vendors as VendorRow[]}
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
