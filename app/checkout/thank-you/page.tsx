'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircle, ShoppingBag, Clock, Truck } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function ThankYouPage() {
  const searchParams = useSearchParams();
  const [orderId, setOrderId] = useState<string | null>(null);
  const [reference, setReference] = useState<string | null>(null);

  useEffect(() => {
    // Get order information from URL parameters
    const orderIdParam = searchParams.get('orderId');
    const referenceParam = searchParams.get('reference');

    if (orderIdParam) {
      setOrderId(orderIdParam);
    }

    if (referenceParam) {
      setReference(referenceParam);
    }
  }, [searchParams]);

  return (
    <div className="container mx-auto px-4 py-16 max-w-4xl">
      <div className="text-center mb-12">
        <div className="flex justify-center mb-6">
          <div className="bg-green-100 p-4 rounded-full">
            <CheckCircle className="h-16 w-16 text-green-600" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Thank You for Your Order!</h1>
        <p className="text-lg text-gray-600 max-w-xl mx-auto">
          Your payment has been processed successfully. We've sent a confirmation email with all the details.
        </p>
        
        {orderId && (
          <p className="mt-4 text-sm text-gray-500">
            Order ID: <span className="font-semibold">{orderId}</span>
          </p>
        )}
        
        {reference && (
          <p className="text-sm text-gray-500">
            Payment Reference: <span className="font-semibold">{reference}</span>
          </p>
        )}
      </div>

      <Card className="mb-10 bg-white shadow-sm">
        <CardContent className="p-8">
          <h2 className="text-xl font-semibold mb-6">What Happens Next?</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex flex-col items-center text-center p-4">
              <ShoppingBag className="h-10 w-10 text-zervia-600 mb-4" />
              <h3 className="font-medium mb-2">Order Processing</h3>
              <p className="text-gray-600 text-sm">
                Your order is being prepared by the vendor(s) and will be delivered to your chosen pickup agent.
              </p>
            </div>
            
            <div className="flex flex-col items-center text-center p-4">
              <Clock className="h-10 w-10 text-zervia-600 mb-4" />
              <h3 className="font-medium mb-2">Pickup Notification</h3>
              <p className="text-gray-600 text-sm">
                You'll receive a notification when your order is ready for pickup at your selected agent location.
              </p>
            </div>
            
            <div className="flex flex-col items-center text-center p-4">
              <Truck className="h-10 w-10 text-zervia-600 mb-4" />
              <h3 className="font-medium mb-2">Pickup Your Order</h3>
              <p className="text-gray-600 text-sm">
                Visit your chosen agent location to collect your order using your pickup code.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button asChild className="bg-zervia-600 hover:bg-zervia-700">
          <Link href="/customer/orders">
            Track Your Order
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/products">
            Continue Shopping
          </Link>
        </Button>
      </div>
    </div>
  );
} 