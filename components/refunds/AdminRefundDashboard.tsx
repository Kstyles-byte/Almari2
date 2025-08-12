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
  Eye,
  AlertTriangle,
  TrendingUp,
  Users,
  DollarSign
} from 'lucide-react';

interface AdminRefundDashboardProps {
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

export function AdminRefundDashboard({ refunds }: AdminRefundDashboardProps) {
  const router = useRouter();
  const [filter, setFilter] = useState('all');
  const [selectedRefund, setSelectedRefund] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredRefunds = refunds.filter(refund => {
    const matchesFilter = filter === 'all' || refund.status.toLowerCase() === filter.toLowerCase();
    const matchesSearch = searchTerm === '' || 
      refund.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      refund.customer?.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      refund.vendor?.storeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      refund.orderItem?.product?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  const handleRefundOverride = async (refundId: string, action: 'approve' | 'reject') => {
    setIsProcessing(true);
    
    try {
      const res = await fetch(`/api/admin/refunds/${refundId}/override`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          admin_notes: adminNotes || undefined
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to override refund');
      }

      toast.success(`Refund ${action}d successfully`);
      setSelectedRefund(null);
      setAdminNotes('');
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  // Calculate statistics
  const pendingCount = refunds.filter(r => r.status === 'PENDING').length;
  const approvedCount = refunds.filter(r => r.status === 'APPROVED').length;
  const rejectedCount = refunds.filter(r => r.status === 'REJECTED').length;
  const totalAmount = refunds.reduce((sum, r) => sum + Number(r.refund_amount), 0);
  const uniqueVendors = new Set(refunds.map(r => r.vendor_id)).size;

  if (refunds.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">No refund requests</h3>
        <p className="mt-2 text-muted-foreground">
          No refund requests have been made yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <DollarSign className="h-4 w-4 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total Value</p>
                <p className="text-lg font-bold">{formatCurrency(totalAmount)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="h-4 w-4 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Vendors</p>
                <p className="text-2xl font-bold">{uniqueVendors}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex items-center gap-2">
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
        <Input
          placeholder="Search by ID, customer, vendor, or product..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 max-w-md"
        />
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
                <div className="flex items-center gap-2">
                  {refund.status === 'REJECTED' && refund.return?.vendor_decision && (
                    <Badge variant="outline" className="bg-yellow-50">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Override Available
                    </Badge>
                  )}
                  <Badge variant={getStatusBadgeVariant(refund.status)}>
                    {refund.status}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Product Information</h4>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p><strong>Product:</strong> {refund.orderItem?.product?.name}</p>
                    <p><strong>Quantity:</strong> {refund.orderItem?.quantity}</p>
                    <p><strong>Amount:</strong> {formatCurrency(refund.refund_amount)}</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Customer & Vendor</h4>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p><strong>Customer:</strong> {refund.customer?.user?.name}</p>
                    <p><strong>Email:</strong> {refund.customer?.user?.email}</p>
                    <p><strong>Vendor:</strong> {refund.vendor?.storeName}</p>
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

              {/* Description */}
              {refund.description && (
                <div>
                  <h4 className="font-medium mb-2">Customer Description</h4>
                  <p className="text-sm text-muted-foreground bg-muted p-3 rounded">
                    {refund.description}
                  </p>
                </div>
              )}

              {/* Vendor Response */}
              {refund.vendor_response && (
                <div>
                  <h4 className="font-medium mb-2">Vendor Response</h4>
                  <p className="text-sm text-muted-foreground bg-blue-50 p-3 rounded">
                    {refund.vendor_response}
                  </p>
                </div>
              )}

              {/* Admin Notes */}
              {refund.admin_notes && (
                <div>
                  <h4 className="font-medium mb-2">Admin Notes</h4>
                  <p className="text-sm text-muted-foreground bg-purple-50 p-3 rounded">
                    {refund.admin_notes}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex gap-2">
                  <Link
                    href={`/admin/orders/${refund.order?.id}`}
                    className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    View Order
                  </Link>
                  <Link
                    href={`/admin/customers/${refund.customer?.id}`}
                    className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    View Customer
                  </Link>
                </div>

                {(refund.status === 'REJECTED' || refund.status === 'PENDING') && (
                  <div className="flex gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedRefund(refund)}
                        >
                          <XCircle className="h-3 w-3 mr-1" />
                          Override Reject
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Override - Reject Refund</DialogTitle>
                          <DialogDescription>
                            This will override the vendor decision and reject the refund request.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <Textarea
                            placeholder="Admin notes (required for override)..."
                            value={adminNotes}
                            onChange={(e) => setAdminNotes(e.target.value)}
                          />
                        </div>
                        <DialogFooter>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setSelectedRefund(null);
                              setAdminNotes('');
                            }}
                          >
                            Cancel
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={() => handleRefundOverride(refund.id, 'reject')}
                            disabled={isProcessing || !adminNotes.trim()}
                          >
                            {isProcessing ? 'Processing...' : 'Override & Reject'}
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
                          Override Approve
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Override - Approve Refund</DialogTitle>
                          <DialogDescription>
                            This will override the vendor decision and approve the refund of {formatCurrency(refund.refund_amount)}.
                            The vendor's payout will be adjusted accordingly.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <Textarea
                            placeholder="Admin notes (required for override)..."
                            value={adminNotes}
                            onChange={(e) => setAdminNotes(e.target.value)}
                          />
                        </div>
                        <DialogFooter>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setSelectedRefund(null);
                              setAdminNotes('');
                            }}
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={() => handleRefundOverride(refund.id, 'approve')}
                            disabled={isProcessing || !adminNotes.trim()}
                          >
                            {isProcessing ? 'Processing...' : 'Override & Approve'}
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
