import React from 'react';

export default function EnhancedDashboard({ refundImpact }) {
  if (!refundImpact) {
    return null;
  }

  return (
    <div className="p-4 space-y-6">
      <h2 className="text-xl font-bold">Refund Impact Summary</h2>
      <ul className="space-y-2">
        {refundImpact.impact?.map((vendorImpact) => (
          <li key={vendorImpact.vendorId} className="border rounded p-4">
            <h3 className="text-lg font-semibold">{vendorImpact.storeName}</h3>
            <p>Total Pending Refunds: {vendorImpact.pendingRefunds.totalPendingRefunds}</p>
            <p>Total Refund Count: {vendorImpact.pendingRefunds.refundCount}</p>
            <p>Balance After Refunds: {vendorImpact.balanceAfterRefunds}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
