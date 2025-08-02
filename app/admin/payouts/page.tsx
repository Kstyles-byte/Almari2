import React, { Suspense } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import PayoutsTable from './payouts-table';

export default function PayoutsPage() {
  return (
    <AdminLayout>
      <div className="container mx-auto">
        <h1 className="text-2xl font-bold mb-6">Payout Management</h1>
        <Suspense fallback={<div>Loading payouts...</div>}>
          <PayoutsTable />
        </Suspense>
      </div>
    </AdminLayout>
  );
}

