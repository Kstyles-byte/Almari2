'use client';

import React from 'react';
import { DataTable, Column } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { togglePublish } from '@/actions/admin-products';

export type ProductRow = {
  id: string;
  name: string;
  is_published: boolean;
  created_at: string;
  vendor_name?: string;
};

interface Pagination {
  currentPage: number;
  totalPages: number;
  pageSize: number;
}

interface Props {
  products: ProductRow[];
  pagination: Pagination;
  prevPageUrl: string | null;
  nextPageUrl: string | null;
}

function PublishToggle({ id, published }: { id: string; published: boolean }) {
  const [loading, setLoading] = React.useState(false);
  const handleClick = async () => {
    try {
      setLoading(true);
      await togglePublish(id, !published);
    } finally {
      setLoading(false);
    }
  };
  return (
    <Button size="sm" variant={published ? 'destructive' : 'default'} onClick={handleClick} disabled={loading}>
      {published ? 'Unpublish' : 'Publish'}
    </Button>
  );
}

// Featured column removed – toggle no longer needed

export default function ProductsTableClient({ products, pagination, prevPageUrl, nextPageUrl }: Props) {
  const columns: Column<ProductRow>[] = [
    { header: 'Name', accessor: 'name', sortable: true },
    { header: 'Vendor', accessor: 'vendor_name', sortable: true },
    {
      header: 'Published',
      accessor: (row) => (row.is_published ? 'Yes' : 'No'),
      sortable: true,
    },
    {
      header: 'Actions',
      accessor: (row) => (
        <div className="flex gap-2">
          <PublishToggle id={row.id} published={row.is_published} />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <DataTable<ProductRow>
        columns={columns}
        data={products}
        pagination={pagination}
      />
      {/* Pagination links (fallback if server pagination is preferred) */}
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