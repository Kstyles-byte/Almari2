"use client"

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { OrderDetail, Order, OrderItem } from '@/components/customer/order-detail';
import ReturnRequestForm from '@/components/customer/return-request-form';

interface OrderDetailWrapperProps {
  order: Order;
}

export function OrderDetailWrapper({ order }: OrderDetailWrapperProps) {
  const [showReturnForm, setShowReturnForm] = useState(false);
  const [selectedOrderItem, setSelectedOrderItem] = useState<{
    orderId: string;
    productId: string;
    vendorId: string;
    agentId: string;
    productName: string;
    price: number;
  } | null>(null);

  const router = useRouter();

  // Define all event handlers here in the client component
  const handleTrackOrder = () => {
    router.push(`/customer/orders/${order.id}/tracking`);
  };

  const handleRequestReturn = (orderId: string) => {
    // Find the first item in the order (assumption: returns are handled at order level)
    // In a real implementation, you might want to ask which item they want to return
    if (order.items && order.items.length > 0) {
      const item = order.items[0];
      
      // Extract the vendor string (which is presumably the vendor ID)
      // and use pickup location as agent ID since that's what's available in the Order interface
      setSelectedOrderItem({
        orderId: order.id,
        productId: item.productId,
        vendorId: typeof item.vendor === 'string' ? item.vendor : '', 
        agentId: order.pickupLocation || '',
        productName: item.productName,
        price: item.price,
      });
      setShowReturnForm(true);
    }
  };

  const handleCloseReturnForm = () => {
    setShowReturnForm(false);
    setSelectedOrderItem(null);
  };

  const handleWriteReview = (productId: string) => {
    // Implement write review functionality
    console.log('Writing review for product', productId);
    // You could open a review modal here
  };

  const handleDownloadInvoice = (orderId: string) => {
    router.push(`/customer/orders/${orderId}/invoice`);
  };

  return (
    <>
      <OrderDetail
        order={order}
        onTrackOrder={handleTrackOrder}
        onRequestReturn={order.returnEligible ? handleRequestReturn : undefined}
        onWriteReview={handleWriteReview}
        onDownloadInvoice={handleDownloadInvoice}
      />
      
      {showReturnForm && selectedOrderItem && (
        <ReturnRequestForm
          isOpen={showReturnForm}
          onClose={handleCloseReturnForm}
          orderItem={selectedOrderItem}
        />
      )}
    </>
  );
} 