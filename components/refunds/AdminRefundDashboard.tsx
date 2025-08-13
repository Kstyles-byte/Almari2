'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';

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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
  DollarSign,
  Download,
  MoreHorizontal,
  Calendar,
  ArrowUpDown,
  RefreshCw
} from 'lucide-react';

interface AdminRefundDashboardProps {
  refunds: any[];
}

interface DateRange {
  from?: Date;
  to?: Date;
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
  const [selectedRefunds, setSelectedRefunds] = useState<string[]>([]);
  const [vendorFilter, setVendorFilter] = useState('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

  // Get unique vendors for filter dropdown
  const uniqueVendors = useMemo(() => {
    const vendors = new Set(refunds.map(r => ({ id: r.vendor_id, name: r.vendor?.store_name })).filter(v => v.name));
    return Array.from(vendors);
  }, [refunds]);

  const filteredAndSortedRefunds = useMemo(() => {
    let filtered = refunds.filter(refund => {
      const matchesFilter = filter === 'all' || refund.status.toLowerCase() === filter.toLowerCase();
      const matchesVendor = vendorFilter === 'all' || refund.vendor_id === vendorFilter;
      const matchesSearch = searchTerm === '' || 
        refund.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        refund.customer?.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        refund.vendor?.store_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        refund.orderItem?.product?.name?.toLowerCase().includes(searchTerm.toLowerCase());
      
      let matchesDate = true;
      if (dateRange?.from) {
        const refundDate = new Date(refund.created_at);
        matchesDate = refundDate >= dateRange.from;
        if (dateRange.to) {
          matchesDate = matchesDate && refundDate <= dateRange.to;
        }
      }
      
      return matchesFilter && matchesVendor && matchesSearch && matchesDate;
    });

    // Sort the filtered results
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'amount':
          aValue = Number(a.refund_amount);
          bValue = Number(b.refund_amount);
          break;
        case 'customer':
          aValue = a.customer?.user?.name || '';
          bValue = b.customer?.user?.name || '';
          break;
        case 'vendor':
          aValue = a.vendor?.store_name || '';
          bValue = b.vendor?.store_name || '';
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        default:
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [refunds, filter, vendorFilter, searchTerm, dateRange, sortBy, sortOrder]);

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

  const handleBulkAction = async (action: 'approve' | 'reject') => {
    if (selectedRefunds.length === 0) {
      toast.error('Please select refunds to process');
      return;
    }

    setIsBulkProcessing(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      for (const refundId of selectedRefunds) {
        try {
          const res = await fetch(`/api/admin/refunds/${refundId}/override`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              action,
              admin_notes: `Bulk ${action} by admin`
            }),
          });

          if (res.ok) {
            successCount++;
          } else {
            errorCount++;
          }
        } catch {
          errorCount++;
        }
      }

      toast.success(`${successCount} refunds processed successfully. ${errorCount} failed.`);
      setSelectedRefunds([]);
      router.refresh();
    } catch (error) {
      toast.error('Bulk operation failed');
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleSelectAll = () => {
    if (selectedRefunds.length === filteredAndSortedRefunds.length) {
      setSelectedRefunds([]);
    } else {
      setSelectedRefunds(filteredAndSortedRefunds.map(r => r.id));
    }
  };

  const handleExport = () => {
    const csvData = filteredAndSortedRefunds.map(refund => ({
      'Refund ID': refund.id,
      'Status': refund.status,
      'Customer': refund.customer?.user?.name || '',
      'Vendor': refund.vendor?.store_name || '',
      'Product': refund.orderItem?.product?.name || '',
      'Amount': refund.refund_amount,
      'Reason': refund.reason,
      'Created': new Date(refund.created_at).toLocaleDateString(),
      'Description': refund.description || '',
      'Vendor Response': refund.vendor_response || '',
      'Admin Notes': refund.admin_notes || ''
    }));

    const csvContent = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).map(val => `"${val}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `refunds-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Refunds exported successfully');
  };

  // Calculate statistics - using filtered data for insights
  const pendingCount = filteredAndSortedRefunds.filter(r => r.status === 'PENDING').length;
  const approvedCount = filteredAndSortedRefunds.filter(r => r.status === 'APPROVED').length;
  const rejectedCount = filteredAndSortedRefunds.filter(r => r.status === 'REJECTED').length;
  const totalAmount = filteredAndSortedRefunds.reduce((sum, r) => sum + Number(r.refund_amount), 0);
  const filteredVendors = new Set(filteredAndSortedRefunds.map(r => r.vendor_id)).size;
  
  // Global statistics for context
  const globalStats = {
    total: refunds.length,
    totalPending: refunds.filter(r => r.status === 'PENDING').length,
    totalApproved: refunds.filter(r => r.status === 'APPROVED').length,
    totalRejected: refunds.filter(r => r.status === 'REJECTED').length,
    totalAmount: refunds.reduce((sum, r) => sum + Number(r.refund_amount), 0),
    totalVendors: new Set(refunds.map(r => r.vendor_id)).size
  };

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
    <div className="space-y-6 px-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Clock className="h-4 w-4 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">{pendingCount}</p>
                <p className="text-xs text-muted-foreground">of {globalStats.totalPending} total</p>
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
                <p className="text-xs text-muted-foreground">of {globalStats.totalApproved} total</p>
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
                <p className="text-xs text-muted-foreground">of {globalStats.totalRejected} total</p>
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
                <p className="text-sm font-medium text-muted-foreground">Filtered Value</p>
                <p className="text-lg font-bold">{formatCurrency(totalAmount)}</p>
                <p className="text-xs text-muted-foreground">of {formatCurrency(globalStats.totalAmount)}</p>
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
                <p className="text-2xl font-bold">{filteredVendors}</p>
                <p className="text-xs text-muted-foreground">of {globalStats.totalVendors} total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <TrendingUp className="h-4 w-4 text-indigo-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Selected</p>
                <p className="text-2xl font-bold">{selectedRefunds.length}</p>
                <p className="text-xs text-muted-foreground">of {filteredAndSortedRefunds.length} shown</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Filters and Controls */}
      <div className="space-y-4">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={vendorFilter} onValueChange={setVendorFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Vendor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Vendors</SelectItem>
                {uniqueVendors.map((vendor) => (
                  <SelectItem key={vendor.id} value={vendor.id}>
                    {vendor.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at">Date</SelectItem>
                <SelectItem value="amount">Amount</SelectItem>
                <SelectItem value="customer">Customer</SelectItem>
                <SelectItem value="vendor">Vendor</SelectItem>
                <SelectItem value="status">Status</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            >
              <ArrowUpDown className="h-4 w-4" />
              {sortOrder === 'asc' ? 'Asc' : 'Desc'}
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewMode(viewMode === 'cards' ? 'table' : 'cards')}
            >
              {viewMode === 'cards' ? '📋' : '🔳'} {viewMode === 'cards' ? 'Table' : 'Cards'}
            </Button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <Input
            placeholder="Search by ID, customer, vendor, or product..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 max-w-md"
          />
          
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Input
              type="date"
              value={dateRange?.from ? dateRange.from.toISOString().split('T')[0] : ''}
              onChange={(e) => {
                const date = e.target.value ? new Date(e.target.value) : undefined;
                setDateRange(prev => ({ ...prev, from: date }));
              }}
              placeholder="From date"
              className="w-40"
            />
            <span className="text-muted-foreground">to</span>
            <Input
              type="date"
              value={dateRange?.to ? dateRange.to.toISOString().split('T')[0] : ''}
              onChange={(e) => {
                const date = e.target.value ? new Date(e.target.value) : undefined;
                setDateRange(prev => ({ ...prev, to: date }));
              }}
              placeholder="To date"
              className="w-40"
            />
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedRefunds.length > 0 && (
          <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <span className="text-sm font-medium text-blue-700">
              {selectedRefunds.length} refund{selectedRefunds.length === 1 ? '' : 's'} selected
            </span>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => handleBulkAction('approve')}
                disabled={isBulkProcessing}
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                {isBulkProcessing ? 'Processing...' : 'Approve All'}
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleBulkAction('reject')}
                disabled={isBulkProcessing}
              >
                <XCircle className="h-4 w-4 mr-1" />
                {isBulkProcessing ? 'Processing...' : 'Reject All'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSelectedRefunds([])}
              >
                Clear
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Refund List */}
      {viewMode === 'table' ? (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedRefunds.length === filteredAndSortedRefunds.length && filteredAndSortedRefunds.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>Refund ID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedRefunds.map((refund) => (
                <TableRow key={refund.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedRefunds.includes(refund.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedRefunds([...selectedRefunds, refund.id]);
                        } else {
                          setSelectedRefunds(selectedRefunds.filter(id => id !== refund.id));
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell className="font-mono text-sm">#{refund.id.slice(0, 8)}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(refund.status)}>
                      {refund.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{refund.customer?.user?.name}</TableCell>
                  <TableCell>{refund.vendor?.store_name}</TableCell>
                  <TableCell>{refund.orderItem?.product?.name}</TableCell>
                  <TableCell>{formatCurrency(refund.refund_amount)}</TableCell>
                  <TableCell>{new Date(refund.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {(refund.status === 'REJECTED' || refund.status === 'PENDING') && (
                        <>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <CheckCircle className="h-3 w-3" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Override - Approve Refund</DialogTitle>
                                <DialogDescription>
                                  This will override the vendor decision and approve the refund of {formatCurrency(refund.refund_amount)}.
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
                                <Button variant="outline" onClick={() => setAdminNotes('')}>
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
                          
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <XCircle className="h-3 w-3" />
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
                                <Button variant="outline" onClick={() => setAdminNotes('')}>
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
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredAndSortedRefunds.map((refund) => (
          <Card key={refund.id} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={selectedRefunds.includes(refund.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedRefunds([...selectedRefunds, refund.id]);
                      } else {
                        setSelectedRefunds(selectedRefunds.filter(id => id !== refund.id));
                      }
                    }}
                  />
                  <CardTitle className="text-lg flex items-center gap-2">
                    {getStatusIcon(refund.status)}
                    Refund #{refund.id.slice(0, 8)}
                  </CardTitle>
                </div>
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
                    <p><strong>Vendor:</strong> {refund.vendor?.store_name}</p>
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
      )}
    </div>
  );
}
