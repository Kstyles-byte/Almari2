'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { approveVendor, rejectVendor } from '@/actions/admin-vendors';
import { Check, X, Loader2 } from 'lucide-react';

interface VendorActionsProps {
  vendorId: string;
  isApproved: boolean;
  storeName: string;
}

export function VendorActions({ vendorId, isApproved, storeName }: VendorActionsProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleApprove = async () => {
    setLoading(true);
    try {
      const result = await approveVendor(vendorId);
      if (result.success) {
        toast({
          title: 'Vendor Approved',
          description: `${storeName} has been approved successfully.`,
        });
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to approve vendor',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    setLoading(true);
    try {
      const result = await rejectVendor(vendorId);
      if (result.success) {
        toast({
          title: 'Vendor Rejected',
          description: `${storeName} has been rejected.`,
        });
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to reject vendor',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center space-x-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm text-gray-500">Processing...</span>
      </div>
    );
  }

  if (isApproved) {
    return (
      <div className="flex items-center space-x-2">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <Check className="w-3 h-3 mr-1" />
          Approved
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={handleReject}
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <X className="w-4 h-4 mr-1" />
          Reject
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
        Pending
      </span>
      <Button
        variant="outline"
        size="sm"
        onClick={handleApprove}
        className="text-green-600 hover:text-green-700 hover:bg-green-50"
      >
        <Check className="w-4 h-4 mr-1" />
        Approve
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={handleReject}
        className="text-red-600 hover:text-red-700 hover:bg-red-50"
      >
        <X className="w-4 h-4 mr-1" />
        Reject
      </Button>
    </div>
  );
}
