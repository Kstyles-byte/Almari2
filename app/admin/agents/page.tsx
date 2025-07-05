import React from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { AgentManagementUI } from '@/components/admin/agents/agent-management';

export const metadata = {
  title: 'Agent Management | Zervia Admin',
  description: 'Manage delivery agents in the Zervia e-commerce platform',
};

export default function AgentsPage() {
  return (
    <AdminLayout>
      <div className="container mx-auto">
        <h1 className="text-2xl font-bold mb-6">Agent Management</h1>
        <AgentManagementUI />
      </div>
    </AdminLayout>
  );
} 