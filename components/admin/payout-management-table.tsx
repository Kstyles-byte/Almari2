'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { approvePayout, rejectPayout, getVendorAvailableBalance } from '@/actions/payouts';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import BulkPayoutActions from './bulk-payout-actions';
import { CheckSquare, Square, Eye, Edit3, Filter, Download, Search, ChevronDown, ChevronUp } from 'lucide-react';

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

  if (payouts.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-8 text-center">
        <p className="text-gray-500">No pending payout requests found.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <h2 className="font-semibold text-gray-900">Pending Payout Requests</h2>
        <p className="text-sm text-gray-600 mt-1">{payouts.length} requests awaiting approval</p>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Vendor
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Bank Details
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
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
              <tr key={payout.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {payout.Vendor?.store_name || 'Unknown Store'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {payout.Vendor?.User?.email || 'No email'}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {formatCurrency(payout.request_amount || payout.amount)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    <div>{payout.bank_details?.accountName}</div>
                    <div className="text-gray-500">
                      {payout.bank_details?.accountNumber} - {payout.bank_details?.bankName}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(payout.created_at)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                    {payout.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  {payout.status === 'PENDING' && (
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        onClick={() => handleApprove(payout.id, payout.request_amount || payout.amount)}
                        disabled={loading[payout.id]}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        {loading[payout.id] ? 'Processing...' : 'Approve'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReject(payout.id)}
                        disabled={loading[payout.id]}
                        className="text-red-600 border-red-600 hover:bg-red-50"
                      >
                        {loading[payout.id] ? 'Processing...' : 'Reject'}
                      </Button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
