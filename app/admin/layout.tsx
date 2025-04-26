import React from 'react';
import { redirect } from 'next/navigation';
import { Sidebar } from '@/components/admin/sidebar';
import { DashboardHeader } from '@/components/admin/dashboard-header';

export const metadata = {
  title: 'Admin Dashboard | Zervia',
  description: 'Admin dashboard for Zervia e-commerce platform',
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-x-hidden">
        <DashboardHeader />
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
} 