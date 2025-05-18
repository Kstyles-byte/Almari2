'use client';

import { useState } from 'react';
import { ChevronDown, Clock, Package, TruckIcon, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface OrderStatusActionsProps {
  orderItemId: string;
  currentStatus: string;
}

export default function OrderStatusActions({ orderItemId, currentStatus }: OrderStatusActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [status, setStatus] = useState(currentStatus);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const updateOrderStatus = async (newStatus: string) => {
    if (newStatus === status) {
      setIsOpen(false);
      return;
    }

    setIsUpdating(true);
    
    try {
      // This would be replaced with an actual server action
      // const result = await updateOrderItemStatus(orderItemId, newStatus);
      
      // For now, simulate an API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update the local state
      setStatus(newStatus);
      toast.success(`Order status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status');
    } finally {
      setIsUpdating(false);
      setIsOpen(false);
    }
  };

  // Status label colors and icons
  const getStatusConfig = (statusValue: string) => {
    switch (statusValue) {
      case 'PENDING':
        return {
          label: 'Pending',
          icon: Clock,
          buttonClass: 'text-yellow-800 bg-yellow-100 hover:bg-yellow-200'
        };
      case 'PROCESSING':
        return {
          label: 'Processing',
          icon: Package,
          buttonClass: 'text-blue-800 bg-blue-100 hover:bg-blue-200'
        };
      case 'SHIPPED':
        return {
          label: 'Shipped',
          icon: TruckIcon,
          buttonClass: 'text-purple-800 bg-purple-100 hover:bg-purple-200'
        };
      case 'DELIVERED':
        return {
          label: 'Delivered',
          icon: CheckCircle,
          buttonClass: 'text-green-800 bg-green-100 hover:bg-green-200'
        };
      case 'CANCELLED':
        return {
          label: 'Cancelled',
          icon: XCircle,
          buttonClass: 'text-red-800 bg-red-100 hover:bg-red-200'
        };
      default:
        return {
          label: 'Unknown',
          icon: Clock,
          buttonClass: 'text-gray-800 bg-gray-100 hover:bg-gray-200'
        };
    }
  };

  const statusConfig = getStatusConfig(status);
  const StatusIcon = statusConfig.icon;

  return (
    <div className="relative mt-4">
      <button
        onClick={toggleDropdown}
        disabled={isUpdating}
        className={`flex items-center justify-between w-40 px-3 py-2 text-sm font-medium rounded-md ${statusConfig.buttonClass}`}
      >
        <div className="flex items-center">
          <StatusIcon className="w-4 h-4 mr-2" />
          <span>{statusConfig.label}</span>
        </div>
        {isUpdating ? (
          <Loader2 className="w-4 h-4 ml-2 animate-spin" />
        ) : (
          <ChevronDown className="w-4 h-4 ml-2" />
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-md overflow-hidden shadow-lg z-20 py-1">
            <button
              onClick={() => updateOrderStatus('PENDING')}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
              disabled={status === 'PENDING'}
            >
              <Clock className="w-4 h-4 mr-2 text-yellow-500" />
              Pending
            </button>
            
            <button
              onClick={() => updateOrderStatus('PROCESSING')}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
              disabled={status === 'PROCESSING'}
            >
              <Package className="w-4 h-4 mr-2 text-blue-500" />
              Processing
            </button>
            
            <button
              onClick={() => updateOrderStatus('SHIPPED')}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
              disabled={status === 'SHIPPED'}
            >
              <TruckIcon className="w-4 h-4 mr-2 text-purple-500" />
              Shipped
            </button>
            
            <button
              onClick={() => updateOrderStatus('DELIVERED')}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
              disabled={status === 'DELIVERED'}
            >
              <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
              Delivered
            </button>
            
            <button
              onClick={() => updateOrderStatus('CANCELLED')}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
              disabled={status === 'CANCELLED'}
            >
              <XCircle className="w-4 h-4 mr-2 text-red-500" />
              Cancelled
            </button>
          </div>
        </>
      )}
    </div>
  );
} 