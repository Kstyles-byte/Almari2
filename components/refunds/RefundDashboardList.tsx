'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Filter, 
  ExternalLink,
  Package,
  Eye
} from 'lucide-react';

interface RefundDashboardListProps {
  refunds: any[];
}

const getStatusBadgeVariant = (status: string) => {
  switch (status) {
    case 'PENDING':
      return 'secondary';
    case 'APPROVED':
      return 'default';
    case 'REJECTED':
      return 'destructive';
    default:
      return 'secondary';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'PENDING':
      return <Clock className="h-4 w-4" />;
    case 'APPROVED':
      return <CheckCircle className="h-4 w-4" />;
    case 'REJECTED':
      return <XCircle className="h-4 w-4" />;
    default:
      return <Clock className="h-4 w-4" />;
  }
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN'
  }).format(amount);
};

export function RefundDashboardList({ refunds }: RefundDashboardListProps) {
  const router = useRouter();
  const [filter, setFilter] = useState('all');
  const [selectedRefund, setSelectedRefund] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [response, setResponse] = useState('');

  const filteredRefunds = refunds.filter(refund => {
    if (filter === 'all') return true;
    return refund.status.toLowerCase() === filter.toLowerCase();
  });

  const handleRefundAction = async (refundId: string, action: 'approve' | 'reject') => {
    setIsProcessing(true);
    
    try {
      const res = await fetch(`/api/refunds/${refundId}`, {
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
      setSelectedRefund(null);
      setResponse('');
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  const pendingCount = refunds.filter(r => r.status === 'PENDING').length;
  const approvedCount = refunds.filter(r => r.status === 'APPROVED').length;
  const rejectedCount = refunds.filter(r => r.status === 'REJECTED').length;

  if (refunds.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">No refund requests</h3>
        <p className="mt-2 text-muted-foreground">
          No customers have requested refunds yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Clock className="h-4 w-4 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">{pendingCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Approved</p>
                <p className="text-2xl font-bold">{approvedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="h-4 w-4 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Rejected</p>
                <p className="text-2xl font-bold">{rejectedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-sm font-medium text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{refunds.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-4">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Refunds</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Refund List */}
      <div className="space-y-4">
        {filteredRefunds.map((refund) => (
          <Card key={refund.id} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  {getStatusIcon(refund.status)}
                  Refund #{refund.id.slice(0, 8)}
                </CardTitle>
                <Badge variant={getStatusBadgeVariant(refund.status)}>
                  {refund.status}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Product & Customer Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Product Information</h4>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p><strong>Product:</strong> {refund.orderItem?.product?.name}</p>
                    <p><strong>Quantity:</strong> {refund.orderItem?.quantity}</p>
                    <p><strong>Amount:</strong> {formatCurrency(refund.refund_amount)}</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Request Details</h4>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p><strong>Reason:</strong> {refund.reason}</p>
                    <p><strong>Requested:</strong> {new Date(refund.created_at).toLocaleDateString()}</p>
                    <p><strong>Order:</strong> #{refund.order?.id?.slice(0, 8)}</p>
                  </div>
                </div>
              </div>

              {refund.description && (
                <div>
                  <h4 className="font-medium mb-2">Customer Description</h4>
                  <p className="text-sm text-muted-foreground bg-muted p-3 rounded">
                    {refund.description}
                  </p>
                </div>
              )}

              {refund.vendor_response && (
                <div>
                  <h4 className="font-medium mb-2">Your Response</h4>
                  <p className="text-sm text-muted-foreground bg-blue-50 p-3 rounded">
                    {refund.vendor_response}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex gap-2">
                  <Link
                    href={`/vendor/refunds/${refund.id}`}
                    className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    View Details
                  </Link>
                  <Link
                    href={`/vendor/orders/${refund.order?.id}`}
                    className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    View Order
                  </Link>
                </div>

                {refund.status === 'PENDING' && (
                  <div className="flex gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedRefund(refund)}
                        >
                          <XCircle className="h-3 w-3 mr-1" />
                          Reject
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Reject Refund Request</DialogTitle>
                          <DialogDescription>
                            Please provide a reason for rejecting this refund request.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <Textarea
                            placeholder="Reason for rejection..."
                            value={response}
                            onChange={(e) => setResponse(e.target.value)}
                          />
                        </div>
                        <DialogFooter>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setSelectedRefund(null);
                              setResponse('');
                            }}
                          >
                            Cancel
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={() => handleRefundAction(refund.id, 'reject')}
                            disabled={isProcessing || !response.trim()}
                          >
                            {isProcessing ? 'Rejecting...' : 'Reject Refund'}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          size="sm"
                          onClick={() => setSelectedRefund(refund)}
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Approve
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Approve Refund Request</DialogTitle>
                          <DialogDescription>
                            This will approve the refund of {formatCurrency(refund.refund_amount)} for {refund.orderItem?.product?.name}.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <Textarea
                            placeholder="Optional response to customer..."
                            value={response}
                            onChange={(e) => setResponse(e.target.value)}
                          />
                        </div>
                        <DialogFooter>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setSelectedRefund(null);
                              setResponse('');
                            }}
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={() => handleRefundAction(refund.id, 'approve')}
                            disabled={isProcessing}
                          >
                            {isProcessing ? 'Approving...' : 'Approve Refund'}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
