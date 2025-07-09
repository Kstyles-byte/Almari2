'use client';

import React from 'react';
import { DataTable, Column } from '@/components/ui/data-table';

export type UserRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
};

interface Pagination {
  currentPage: number;
  totalPages: number;
  pageSize: number;
}

interface Props {
  users: UserRow[];
  pagination: Pagination;
  prevPageUrl: string | null;
  nextPageUrl: string | null;
}

export default function UsersTableClient({ users, pagination, prevPageUrl, nextPageUrl }: Props) {
  const columns: Column<UserRow>[] = [
    { header: 'Name', accessor: 'name', sortable: true },
    { header: 'Email', accessor: 'email', sortable: true },
    { header: 'Role', accessor: 'role', sortable: true },
    { header: 'Created', accessor: (row) => new Date(row.createdAt).toLocaleDateString(), sortable: true },
  ];

  return (
    <div className="space-y-6">
      <DataTable<UserRow> columns={columns} data={users} pagination={pagination} />
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