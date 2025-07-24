import VendorOrdersTable from '@/components/vendor/VendorOrdersTable';

export const dynamic = 'force-dynamic';

export default function VendorOrdersPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Orders</h1>
      <VendorOrdersTable />
    </div>
  );
} 