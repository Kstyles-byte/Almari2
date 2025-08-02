import AdminLayout from '@/components/layout/AdminLayout';
import { getPayoutRequests, getFinancialStats } from '@/actions/payouts';
import PayoutManagementTable from '@/components/admin/payout-management-table';
import FinancialOverview from '@/components/admin/financial-overview';

export default async function PayoutsPage() {
  const [payoutResult, statsResult] = await Promise.all([
    getPayoutRequests(),
    getFinancialStats()
  ]);
  
  return (
    <AdminLayout>
      <div className="container mx-auto">
        <h1 className="text-2xl font-bold mb-6">Payout Management</h1>
        
        {/* Financial Overview */}
        {statsResult.success && (
          <FinancialOverview stats={statsResult.data} />
        )}
        
        {/* Payout Requests Table */}
        {payoutResult.success ? (
          <PayoutManagementTable payouts={payoutResult.data || []} />
        ) : (
          <div className="text-red-600">
            Error loading payouts: {payoutResult.error}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

