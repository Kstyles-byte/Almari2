"use client"

import React, { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { OrderDetail, Order } from '@/components/customer/order-detail';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;
  
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  
  // In a real app, you would fetch this data from an API based on the orderId
  const mockOrder: Order = {
    id: orderId,
    orderNumber: "ZRV-54321",
    status: "delivered",
    createdAt: "2023-10-15T12:00:00Z",
    updatedAt: "2023-10-18T15:30:00Z",
    items: [
      {
        id: "item1",
        productId: "prod1",
        productName: "Premium Leather Wallet",
        productImage: "/images/products/wallet.jpg",
        productSlug: "premium-leather-wallet",
        quantity: 1,
        price: 59.99,
        vendor: "LeatherCraft Co."
      },
      {
        id: "item2",
        productId: "prod2",
        productName: "Cotton T-Shirt - Black",
        productImage: "/images/products/tshirt.jpg",
        productSlug: "cotton-tshirt-black",
        quantity: 2,
        price: 24.99,
        vendor: "Urban Apparel"
      }
    ],
    total: 114.97,
    subtotal: 109.97,
    tax: 5.00,
    shippingFee: 0.00,
    pickupCode: "ZRV-P9876",
    pickupLocation: "Zervia Store - Main Street",
    pickupAddress: "123 Main St, City Center, 10001",
    expectedDeliveryDate: "2023-10-17T00:00:00Z",
    deliveredDate: "2023-10-18T14:30:00Z",
    returnEligible: true,
    returnDeadline: "2023-10-28T00:00:00Z"
  };

  const handleWriteReview = (productId: string) => {
    setSelectedProductId(productId);
    setIsReviewModalOpen(true);
  };

  const handleRequestReturn = (orderId: string) => {
    setIsReturnModalOpen(true);
  };

  const handleTrackOrder = () => {
    // Implement order tracking here
    toast({
      title: "Tracking information",
      description: "Your order is ready for pickup at our store.",
    });
  };

  const handleDownloadInvoice = (orderId: string) => {
    // In a real app, this would trigger a PDF download
    toast({
      title: "Invoice download started",
      description: "Your invoice will be downloaded shortly.",
    });
  };

  // This would be implemented in the actual return request page
  const handleSubmitReturn = () => {
    setIsReturnModalOpen(false);
    router.push(`/customer/returns/new?orderId=${orderId}`);
  };

  // This would be implemented with a proper review form
  const handleSubmitReview = () => {
    setIsReviewModalOpen(false);
    toast({
      title: "Review submitted",
      description: "Thank you for your feedback!",
    });
  };

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      <Button 
        variant="ghost" 
        className="mb-6 text-zervia-600"
        onClick={() => router.push('/customer/orders')}
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Orders
      </Button>
      
      <OrderDetail 
        order={mockOrder}
        onTrackOrder={handleTrackOrder}
        onRequestReturn={handleRequestReturn}
        onWriteReview={handleWriteReview}
        onDownloadInvoice={handleDownloadInvoice}
      />
      
      {/* Review Modal */}
      <Dialog open={isReviewModalOpen} onOpenChange={setIsReviewModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Write a Review</DialogTitle>
            <DialogDescription>
              Share your thoughts about this product
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <p className="text-sm text-zervia-600 mb-4">
              You're reviewing: {selectedProductId && 
                mockOrder.items.find(item => item.productId === selectedProductId)?.productName
              }
            </p>
            
            {/* In a real app, this would be a proper review form component */}
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-2">Rating</p>
                <div className="flex space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button key={star} className="text-yellow-400">
                      ★
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium mb-2">Review</p>
                <textarea 
                  className="w-full p-2 border rounded-md" 
                  rows={4} 
                  placeholder="Write your review here..."
                />
              </div>
              
              <div className="flex justify-end space-x-2 pt-2">
                <Button variant="outline" onClick={() => setIsReviewModalOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSubmitReview}>
                  Submit Review
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Return Request Modal */}
      <Dialog open={isReturnModalOpen} onOpenChange={setIsReturnModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request a Return</DialogTitle>
            <DialogDescription>
              Please confirm that you want to initiate a return request
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="flex items-start space-x-2 bg-amber-50 p-3 rounded-md mb-4">
              <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800">
                You will be redirected to our return request form where you can select which items you wish to return and provide the reason.
              </p>
            </div>
            
            <div className="flex justify-end space-x-2 pt-2">
              <Button variant="outline" onClick={() => setIsReturnModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmitReturn}>
                Continue to Return Form
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 