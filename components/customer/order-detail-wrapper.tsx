"use client"

import { useState } from 'react';
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

  // Define all event handlers here in the client component
  const handleTrackOrder = () => {
    // Implement track order functionality
    console.log('Tracking order', order.id);
    // You could open a modal here or navigate to tracking page
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
    // Implement invoice download functionality
    console.log('Downloading invoice for order', orderId);
    // You could trigger an invoice download here
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