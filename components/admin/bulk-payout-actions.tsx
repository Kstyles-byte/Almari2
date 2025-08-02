'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { approvePayout, rejectPayout } from '@/actions/payouts';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { CheckSquare, XSquare, Loader2 } from 'lucide-react';

interface BulkPayoutActionsProps {
  selectedPayouts: string[];
  onClearSelection: () => void;
}

export default function BulkPayoutActions({ selectedPayouts, onClearSelection }: BulkPayoutActionsProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleBulkApprove = async () => {
    if (selectedPayouts.length === 0) return;

    setLoading(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      for (const payoutId of selectedPayouts) {
        const result = await approvePayout(payoutId);
        if (result.success) {
          successCount++;
        } else {
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`Successfully approved ${successCount} payout(s)`);
      }
      if (errorCount > 0) {
        toast.error(`Failed to approve ${errorCount} payout(s)`);
      }

      onClearSelection();
      router.refresh();
    } catch (error) {
      toast.error('Failed to process bulk approval');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkReject = async () => {
    if (selectedPayouts.length === 0) return;

    setLoading(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      for (const payoutId of selectedPayouts) {
        const result = await rejectPayout(payoutId, 'Bulk rejection by admin');
        if (result.success) {
          successCount++;
        } else {
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`Successfully rejected ${successCount} payout(s)`);
      }
      if (errorCount > 0) {
        toast.error(`Failed to reject ${errorCount} payout(s)`);
      }

      onClearSelection();
      router.refresh();
    } catch (error) {
      toast.error('Failed to process bulk rejection');
    } finally {
      setLoading(false);
    }
  };

  if (selectedPayouts.length === 0) {
    return null;
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <CheckSquare className="h-5 w-5 text-blue-600 mr-2" />
          <span className="text-sm font-medium text-blue-900">
            {selectedPayouts.length} payout(s) selected
          </span>
        </div>
        <div className="flex space-x-2">
          <Button
            size="sm"
            onClick={handleBulkApprove}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CheckSquare className="h-4 w-4 mr-2" />
                Approve All
              </>
            )}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleBulkReject}
            disabled={loading}
            className="text-red-600 border-red-600 hover:bg-red-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <XSquare className="h-4 w-4 mr-2" />
                Reject All
              </>
            )}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={onClearSelection}
            disabled={loading}
          >
            Clear Selection
          </Button>
        </div>
      </div>
    </div>
  );
}
