'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useState } from 'react';
import Link from 'next/link';

interface VendorRefundDetailViewProps {
  refund: any;
}

export function VendorRefundDetailView({ refund }: VendorRefundDetailViewProps) {
  const [response, setResponse] = useState(refund.vendor_response || '');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleRefundAction = async (action: 'approve' | 'reject') => {
    setIsProcessing(true);
    
    try {
      const res = await fetch(`/api/refunds/${refund.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          vendor_response: response || undefined
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to process refund');
      }

      toast.success(`Refund ${action}d successfully`);
      setResponse('');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-4 md:p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-bold">
            Refund Details #{refund.id.slice(0, 8)}
          </CardTitle>
          <div className="text-sm text-muted-foreground">
            Customer: {refund.customer?.user?.name || 'Unknown'}
          </div>
          <div className="text-sm text-muted-foreground">
            Product: {refund.orderItem?.product?.name}
          </div>
          <Badge variant={refund.status === 'APPROVED' ? 'default' : 'secondary'}>
            {refund.status}
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 p-2">
            <p><strong>Amount:</strong> ₦{Number(refund.refund_amount).toFixed(2)}</p>
            <p><strong>Reason:</strong> {refund.reason}</p>
            <p><strong>Requested:</strong> {new Date(refund.created_at).toLocaleDateString()}</p>
            {refund.description && (
              <p><strong>Description:</strong> {refund.description}</p>
            )}
            <div className="text-sm text-gray-700">
              <h4 className="font-medium">Your Response</h4>
              <Textarea
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                placeholder="Enter your response here..."
              />
            </div>
            <div className="flex items-center justify-end gap-2 mt-4">
              {refund.status === 'PENDING' && (
                <>
                  <Button
                    variant="outline"
                    className="mr-2"
                    onClick={() => handleRefundAction('reject')}
                    disabled={isProcessing}
                  >
                    {isProcessing ? 'Rejecting...' : 'Reject Refund'}
                  </Button>
                  <Button
                    onClick={() => handleRefundAction('approve')}
                    disabled={isProcessing}
                  >
                    {isProcessing ? 'Approving...' : 'Approve Refund'}
                  </Button>
                </>
              )}
            </div>
            <div className="flex justify-between pt-2">
              <Link
                href={`/vendor/orders/${refund.order?.id}`}
                className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
              >
                View Order
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
