"use client";
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { getPayoutRequests, approvePayout, rejectPayout } from '@/actions/payouts';

export default function PayoutsTable() {
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPayouts() {
      setLoading(true);
      const result = await getPayoutRequests();
      if (result && result.success && Array.isArray(result.data)) {
        setPayouts(result.data);
      } else {
        setPayouts([]);
      }
      setLoading(false);
    }
    fetchPayouts();
  }, []);

  const handleApproval = async (id) => {
    await approvePayout(id);
    setPayouts(payouts.filter(payout => payout.id !== id));
  };

  const handleRejection = async (id) => {
    await rejectPayout(id);
    setPayouts(payouts.filter(payout => payout.id !== id));
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Date
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Amount
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Status
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Actions
          </th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {payouts.map((payout) => (
          <tr key={payout.id}>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
              {formatDate(payout.created_at)}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {formatCurrency(payout.amount)}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${payout.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                {payout.status}
              </span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
              {payout.status === 'PENDING' && (
                <>
                  <Button onClick={() => handleApproval(payout.id)} className="text-green-600 hover:text-green-900 mr-2">
                    Approve
                  </Button>
                  <Button onClick={() => handleRejection(payout.id)} className="text-red-600 hover:text-red-900">
                    Reject
                  </Button>
                </>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

