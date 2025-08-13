'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { approvePayout, rejectPayout, getVendorAvailableBalance } from '@/actions/payouts';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import BulkPayoutActions from './bulk-payout-actions';
import { 
  CheckSquare, 
  Square, 
  Eye, 
  Edit3, 
  Filter, 
  Download, 
  Search, 
  ChevronDown, 
  ChevronUp,
  AlertTriangle,
  DollarSign,
  Clock,
  Users,
  TrendingDown,
  RefreshCw,
  Shield
} from 'lucide-react';

interface PayoutItem {
  id: string;
  vendor_id: string;
  amount: number;
  request_amount: number;
  status: string;
  created_at: string;
  bank_details: {
    accountName: string;
    accountNumber: string;
    bankName: string;
  };
  Vendor?: {
    store_name: string;
    User?: {
      name: string;
      email: string;
    };
  };
  // Refund impact fields
  refund_holds?: PayoutHold[];
  total_hold_amount?: number;
  adjusted_amount?: number;
  has_pending_refunds?: boolean;
}

interface PayoutHold {
  id: string;
  vendor_id: string;
  hold_amount: number;
  reason: string;
  status: string;
  created_at: string;
  refund_request_ids: string[];
}

interface RefundImpact {
  vendor_id: string;
  pending_refunds: number;
  pending_refund_amount: number;
  hold_amount: number;
  available_for_payout: number;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
}

interface PayoutManagementTableProps {
  payouts: PayoutItem[];
}

export default function PayoutManagementTable({ payouts }: PayoutManagementTableProps) {
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [selectedPayouts, setSelectedPayouts] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [amountRange, setAmountRange] = useState<{ min: string; max: string }>({ min: '', max: '' });
  const [showApprovalDialog, setShowApprovalDialog] = useState<string | null>(null);
  const [showRejectionDialog, setShowRejectionDialog] = useState<string | null>(null);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [vendorBalance, setVendorBalance] = useState<Record<string, number>>({});
  const [refundImpactData, setRefundImpactData] = useState<Record<string, RefundImpact>>({});
  const [payoutHolds, setPayoutHolds] = useState<PayoutHold[]>([]);
  const [activeTab, setActiveTab] = useState('payouts');
  const [loadingRefundData, setLoadingRefundData] = useState(false);
  const router = useRouter();

  const formatCurrency = (amount: number) => {
    return `₦${amount.toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const handleApprove = async (id: string, amount: number) => {
    setLoading(prev => ({ ...prev, [id]: true }));
    try {
      const result = await approvePayout(id, amount);
      if (result.success) {
        toast.success('Payout approved successfully');
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to approve payout');
      }
    } catch (error) {
      toast.error('Failed to approve payout');
    } finally {
      setLoading(prev => ({ ...prev, [id]: false }));
    }
  };

  const handleReject = async (id: string, reason?: string) => {
    setLoading(prev => ({ ...prev, [id]: true }));
    try {
      const result = await rejectPayout(id, reason || 'Rejected by admin');
      if (result.success) {
        toast.success('Payout rejected successfully');
        setShowRejectionDialog(null);
        setRejectionReason('');
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to reject payout');
      }
    } catch (error) {
      toast.error('Failed to reject payout');
    } finally {
      setLoading(prev => ({ ...prev, [id]: false }));
    }
  };

  const handleCustomApproval = async (id: string, amount: number) => {
    setLoading(prev => ({ ...prev, [id]: true }));
    try {
      const result = await approvePayout(id, amount);
      if (result.success) {
        toast.success('Payout approved with custom amount');
        setShowApprovalDialog(null);
        setCustomAmount('');
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to approve payout');
      }
    } catch (error) {
      toast.error('Failed to approve payout');
    } finally {
      setLoading(prev => ({ ...prev, [id]: false }));
    }
  };

  const toggleSelectAll = () => {
    if (selectedPayouts.length === filteredPayouts.length) {
      setSelectedPayouts([]);
    } else {
      setSelectedPayouts(filteredPayouts.map(p => p.id));
    }
  };

  const toggleSelectPayout = (payoutId: string) => {
    setSelectedPayouts(prev => 
      prev.includes(payoutId) 
        ? prev.filter(id => id !== payoutId)
        : [...prev, payoutId]
    );
  };

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: string) => {
    if (!sortConfig || sortConfig.key !== key) {
      return <ChevronDown className="h-4 w-4 text-gray-400" />;
    }
    return sortConfig.direction === 'asc' 
      ? <ChevronUp className="h-4 w-4 text-gray-600" />
      : <ChevronDown className="h-4 w-4 text-gray-600" />;
  };

  const fetchVendorBalance = async (vendorId: string) => {
    try {
      const result = await getVendorAvailableBalance(vendorId);
      if (result.success && result.balance !== undefined) {
        setVendorBalance(prev => ({ ...prev, [vendorId]: result.balance! }));
      }
    } catch (error) {
      console.error('Failed to fetch vendor balance:', error);
    }
  };

  const fetchRefundImpactData = async () => {
    setLoadingRefundData(true);
    try {
      // Fetch payout holds
      const holdsResponse = await fetch('/api/payout-holds?status=ACTIVE');
      let fetchedHolds: PayoutHold[] = [];
      if (holdsResponse.ok) {
        const { holds } = await holdsResponse.json();
        fetchedHolds = holds || [];
        setPayoutHolds(fetchedHolds);
      }

      // Calculate refund impact for each vendor
      const impactData: Record<string, RefundImpact> = {};
      for (const payout of payouts) {
        if (!impactData[payout.vendor_id]) {
          // Fetch vendor-specific refund data
          const refundsResponse = await fetch(`/api/admin/refunds?vendor_id=${payout.vendor_id}&status=PENDING`);
          let pendingRefunds = 0;
          let pendingRefundAmount = 0;
          
          if (refundsResponse.ok) {
            const { refunds } = await refundsResponse.json();
            pendingRefunds = refunds?.length || 0;
            pendingRefundAmount = refunds?.reduce((sum: number, refund: any) => sum + Number(refund.refund_amount), 0) || 0;
          }

          // Get hold amount for this vendor
          const vendorHolds = fetchedHolds?.filter((hold: PayoutHold) => 
            hold.vendor_id === payout.vendor_id && hold.status === 'ACTIVE'
          ) || [];
          const holdAmount = vendorHolds.reduce((sum, hold) => sum + Number(hold.hold_amount), 0);

          // Calculate available for payout (payout amount minus holds)
          const availableForPayout = Math.max(0, payout.request_amount - holdAmount);

          // Determine risk level
          let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
          if (pendingRefunds > 5 || pendingRefundAmount > payout.request_amount * 0.3) {
            riskLevel = 'HIGH';
          } else if (pendingRefunds > 2 || pendingRefundAmount > payout.request_amount * 0.1) {
            riskLevel = 'MEDIUM';
          }

          impactData[payout.vendor_id] = {
            vendor_id: payout.vendor_id,
            pending_refunds: pendingRefunds,
            pending_refund_amount: pendingRefundAmount,
            hold_amount: holdAmount,
            available_for_payout: availableForPayout,
            risk_level: riskLevel
          };
        }
      }
      
      setRefundImpactData(impactData);
    } catch (error) {
      console.error('Failed to fetch refund impact data:', error);
      toast.error('Failed to load refund impact data');
    } finally {
      setLoadingRefundData(false);
    }
  };

  const approvePayoutWithHolds = async (payoutId: string, originalAmount: number) => {
    const impact = refundImpactData[payouts.find(p => p.id === payoutId)?.vendor_id || ''];
    if (!impact) {
      toast.error('Unable to calculate refund impact');
      return;
    }

    const adjustedAmount = Math.max(0, originalAmount - impact.hold_amount);
    
    if (adjustedAmount === 0) {
      toast.error('Cannot approve payout: full amount is held due to pending refunds');
      return;
    }

    if (adjustedAmount < originalAmount) {
      const confirmed = confirm(
        `Payout will be approved for ${formatCurrency(adjustedAmount)} (reduced from ${formatCurrency(originalAmount)} due to refund holds). Continue?`
      );
      if (!confirmed) return;
    }

    await handleApprove(payoutId, adjustedAmount);
  };

  const releasePayoutHold = async (holdId: string) => {
    try {
      const response = await fetch(`/api/payout-holds/${holdId}/release`, {
        method: 'PUT',
      });

      if (response.ok) {
        toast.success('Payout hold released successfully');
        fetchRefundImpactData(); // Refresh data
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to release hold');
      }
    } catch (error) {
      toast.error('Failed to release payout hold');
    }
  };

  // Fetch refund impact data on component mount
  useEffect(() => {
    if (payouts.length > 0) {
      fetchRefundImpactData();
    }
  }, [payouts]);

  // Filter and sort payouts
  let filteredPayouts = payouts.filter(payout => {
    const matchesSearch = searchTerm === '' || 
      payout.Vendor?.store_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payout.Vendor?.User?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || payout.status === statusFilter;
    
    const amount = payout.request_amount || payout.amount;
    const matchesAmount = 
      (amountRange.min === '' || amount >= parseFloat(amountRange.min)) &&
      (amountRange.max === '' || amount <= parseFloat(amountRange.max));
    
    return matchesSearch && matchesStatus && matchesAmount;
  });

  if (sortConfig) {
    filteredPayouts.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortConfig.key) {
        case 'vendor':
          aValue = a.Vendor?.store_name || '';
          bValue = b.Vendor?.store_name || '';
          break;
        case 'amount':
          aValue = a.request_amount || a.amount;
          bValue = b.request_amount || b.amount;
          break;
        case 'date':
          aValue = new Date(a.created_at);
          bValue = new Date(b.created_at);
          break;
        default:
          return 0;
      }
      
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }

  // Calculate summary statistics
  const totalPayouts = payouts.length;
  const totalHolds = payoutHolds.length;
  const totalHoldAmount = payoutHolds.reduce((sum, hold) => sum + Number(hold.hold_amount), 0);
  const totalPayoutAmount = payouts.reduce((sum, payout) => sum + Number(payout.request_amount || payout.amount), 0);
  const payoutsWithRefundRisk = Object.values(refundImpactData).filter(impact => impact.risk_level !== 'LOW').length;

  if (payouts.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-8 text-center">
        <p className="text-gray-500">No pending payout requests found.</p>
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
              <div className="p-2 bg-blue-100 rounded-lg">
                <DollarSign className="h-4 w-4 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total Payouts</p>
                <p className="text-2xl font-bold">{totalPayouts}</p>
                <p className="text-xs text-muted-foreground">{formatCurrency(totalPayoutAmount)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Shield className="h-4 w-4 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Active Holds</p>
                <p className="text-2xl font-bold">{totalHolds}</p>
                <p className="text-xs text-muted-foreground">{formatCurrency(totalHoldAmount)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">High Risk</p>
                <p className="text-2xl font-bold">{payoutsWithRefundRisk}</p>
                <p className="text-xs text-muted-foreground">vendors with refund risk</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingDown className="h-4 w-4 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Available</p>
                <p className="text-lg font-bold">{formatCurrency(totalPayoutAmount - totalHoldAmount)}</p>
                <p className="text-xs text-muted-foreground">after holds</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <RefreshCw className="h-4 w-4 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Data Status</p>
                <p className="text-sm font-bold">{loadingRefundData ? 'Loading...' : 'Updated'}</p>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={fetchRefundImpactData}
                  disabled={loadingRefundData}
                  className="text-xs p-0 h-auto"
                >
                  Refresh
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="payouts">Payout Requests</TabsTrigger>
          <TabsTrigger value="holds">Refund Holds</TabsTrigger>
          <TabsTrigger value="impact">Impact Analysis</TabsTrigger>
        </TabsList>
        
        <TabsContent value="payouts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Payout Requests</CardTitle>
              <p className="text-sm text-muted-foreground">{payouts.length} requests awaiting approval</p>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Vendor
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount & Impact
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Refund Risk
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Bank Details
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredPayouts.map((payout) => {
                      const impact = refundImpactData[payout.vendor_id];
                      const hasRisk = impact && (impact.pending_refunds > 0 || impact.hold_amount > 0);
                      
                      return (
                        <tr key={payout.id} className={`hover:bg-gray-50 ${hasRisk ? 'bg-yellow-50' : ''}`}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
                                {payout.Vendor?.store_name || 'Unknown Store'}
                                {hasRisk && (
                                  <Badge variant="secondary" className="text-xs">
                                    <AlertTriangle className="h-3 w-3 mr-1" />
                                    Risk
                                  </Badge>
                                )}
                              </div>
                              <div className="text-sm text-gray-500">
                                {payout.Vendor?.User?.email || 'No email'}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="space-y-1">
                              <div className="text-sm font-medium text-gray-900">
                                {formatCurrency(payout.request_amount || payout.amount)}
                              </div>
                              {impact && impact.hold_amount > 0 && (
                                <div className="text-xs text-red-600">
                                  Hold: -{formatCurrency(impact.hold_amount)}
                                </div>
                              )}
                              {impact && impact.available_for_payout !== (payout.request_amount || payout.amount) && (
                                <div className="text-xs text-green-600 font-medium">
                                  Available: {formatCurrency(impact.available_for_payout)}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {impact ? (
                              <div className="space-y-1">
                                <Badge variant={
                                  impact.risk_level === 'HIGH' ? 'destructive' : 
                                  impact.risk_level === 'MEDIUM' ? 'secondary' : 'default'
                                }>
                                  {impact.risk_level}
                                </Badge>
                                {impact.pending_refunds > 0 && (
                                  <div className="text-xs text-muted-foreground">
                                    {impact.pending_refunds} pending refunds
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="text-xs text-muted-foreground">Loading...</div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              <div>{payout.bank_details?.accountName}</div>
                              <div className="text-gray-500 text-xs">
                                {payout.bank_details?.accountNumber} - {payout.bank_details?.bankName}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(payout.created_at)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            {payout.status === 'PENDING' && (
                              <div className="flex space-x-2">
                                <Button
                                  size="sm"
                                  onClick={() => impact ? approvePayoutWithHolds(payout.id, payout.request_amount || payout.amount) : handleApprove(payout.id, payout.request_amount || payout.amount)}
                                  disabled={loading[payout.id]}
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                >
                                  {loading[payout.id] ? 'Processing...' : 'Approve'}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setShowRejectionDialog(payout.id)}
                                  disabled={loading[payout.id]}
                                  className="text-red-600 border-red-600 hover:bg-red-50"
                                >
                                  Reject
                                </Button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="holds" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Payout Holds</CardTitle>
              <p className="text-sm text-muted-foreground">
                {payoutHolds.length} active holds affecting vendor payouts
              </p>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Vendor
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Hold Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Reason
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Refunds Affected
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {payoutHolds.map((hold) => (
                      <tr key={hold.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            Vendor ID: {hold.vendor_id.slice(0, 8)}...
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-red-600">
                            {formatCurrency(hold.hold_amount)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 max-w-xs truncate">
                            {hold.reason}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {hold.refund_request_ids?.length || 0} refunds
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(hold.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => releasePayoutHold(hold.id)}
                            className="text-blue-600 border-blue-600 hover:bg-blue-50"
                          >
                            Release Hold
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="impact" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Refund Impact Analysis</CardTitle>
              <p className="text-sm text-muted-foreground">
                Analysis of how pending refunds affect vendor payouts
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {Object.entries(refundImpactData).map(([vendorId, impact]) => {
                  const payout = payouts.find(p => p.vendor_id === vendorId);
                  if (!payout) return null;
                  
                  return (
                    <div key={vendorId} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-medium">{payout.Vendor?.store_name}</h4>
                          <p className="text-sm text-muted-foreground">{payout.Vendor?.User?.email}</p>
                        </div>
                        <Badge variant={
                          impact.risk_level === 'HIGH' ? 'destructive' : 
                          impact.risk_level === 'MEDIUM' ? 'secondary' : 'default'
                        }>
                          {impact.risk_level} RISK
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Requested Amount</p>
                          <p className="font-medium">{formatCurrency(payout.request_amount || payout.amount)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Pending Refunds</p>
                          <p className="font-medium">{impact.pending_refunds}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Hold Amount</p>
                          <p className="font-medium text-red-600">{formatCurrency(impact.hold_amount)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Available for Payout</p>
                          <p className="font-medium text-green-600">{formatCurrency(impact.available_for_payout)}</p>
                        </div>
                      </div>
                      
                      {impact.pending_refund_amount > 0 && (
                        <div className="mt-3 p-3 bg-yellow-50 rounded">
                          <p className="text-sm text-yellow-800">
                            ⚠️ {formatCurrency(impact.pending_refund_amount)} in pending refunds could affect future payouts
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Rejection Dialog */}
      {showRejectionDialog && (
        <Dialog open={!!showRejectionDialog} onOpenChange={() => setShowRejectionDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject Payout Request</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Label htmlFor="rejection-reason">Reason for rejection</Label>
              <Textarea
                id="rejection-reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Please provide a reason for rejecting this payout..."
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowRejectionDialog(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  handleReject(showRejectionDialog, rejectionReason);
                  setShowRejectionDialog(null);
                }}
                disabled={!rejectionReason.trim()}
              >
                Reject Payout
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
