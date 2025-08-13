'use client';

import React from 'react';
import Link from 'next/link';
import { DataTable, Column } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';

export type UserRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  customerId?: string;
  formattedDate?: string;
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
  // Format dates before passing to DataTable
  const formattedUsers = users.map(user => ({
    ...user,
    formattedDate: new Date(user.createdAt).toLocaleDateString()
  }));

  const columns: Column<UserRow>[] = [
    { header: 'Name', accessor: 'name', sortable: true },
    { header: 'Email', accessor: 'email', sortable: true },
    { header: 'Role', accessor: 'role', sortable: true },
    { header: 'Created', accessor: 'formattedDate', sortable: true },
    {
      header: 'Actions',
      accessor: (row) => {
        if (row.role === 'CUSTOMER' && row.customerId) {
          return (
            <Link href={`/admin/customers/${row.customerId}`}>
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-1" />
                View
              </Button>
            </Link>
          );
        }
        return <span className="text-muted-foreground text-sm">-</span>;
      },
    },
  ];

  return (
    <div className="space-y-6">
      <DataTable<UserRow> columns={columns} data={formattedUsers} pagination={pagination} />
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