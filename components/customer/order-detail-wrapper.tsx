"use client"

import { useRouter } from 'next/navigation';
import { OrderDetail, Order } from '@/components/customer/order-detail';

interface OrderDetailWrapperProps {
  order: Order;
}

export function OrderDetailWrapper({ order }: OrderDetailWrapperProps) {
  const router = useRouter();

  // Define all event handlers here in the client component
  const handleTrackOrder = () => {
    router.push(`/customer/orders/${order.id}/tracking`);
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
    <OrderDetail
      order={order}
      onTrackOrder={handleTrackOrder}
      onWriteReview={handleWriteReview}
      onDownloadInvoice={handleDownloadInvoice}
    />
  );
}