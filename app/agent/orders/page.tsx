import AgentOrdersTable from '@/components/agent/AgentOrdersTable';

export const dynamic = 'force-dynamic';

export default function AgentOrdersPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Orders</h1>
      <AgentOrdersTable />
    </div>
  );
}
