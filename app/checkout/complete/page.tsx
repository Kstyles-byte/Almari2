'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { verifyOrderPayment } from '@/actions/orders';
import { Loader2, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

function CheckoutCompleteContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'completed' | 'failed' | 'error'>('loading');
  const [message, setMessage] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);

  useEffect(() => {
    const ref = searchParams.get('reference');
    // Paystack might use `trxref` as well
    const transactionRef = ref || searchParams.get('trxref');
    const orderIdParam = searchParams.get('orderId');

    setOrderId(orderIdParam); // Store orderId for potential display

    if (!transactionRef || !orderIdParam) {
      setMessage("Payment reference or order ID missing from callback URL.");
      setStatus('error');
      return;
    }

    const verifyPayment = async () => {
      try {
        const formData = new FormData();
        formData.append('orderId', orderIdParam);
        formData.append('paymentReference', transactionRef);

        const result = await verifyOrderPayment(formData);

        if (result.success) {
          setStatus('completed');
          setMessage("Payment successful! Your order is being processed.");
          
          // Redirect to thank-you page after a brief delay
          setTimeout(() => {
            router.push(`/checkout/thank-you?orderId=${orderIdParam}&reference=${transactionRef}`);
          }, 2000);
        } else {
          setStatus('failed');
          setMessage(result.error || "Payment verification failed. Please contact support if payment was debited.");
        }
      } catch (err) {
        console.error("Error verifying payment:", err);
        setStatus('error');
        setMessage(err instanceof Error ? err.message : "An unexpected error occurred during payment verification.");
      }
    };

    verifyPayment();
  }, [searchParams, router]);

  return (
    <div className="container mx-auto p-4 py-16 flex flex-col items-center text-center">
      {status === 'loading' && (
        <>
          <Loader2 className="h-16 w-16 text-zervia-600 animate-spin mb-4" />
          <h1 className="text-2xl font-semibold mb-2">Verifying Payment...</h1>
          <p className="text-gray-600">Please wait while we confirm your transaction.</p>
        </>
      )}

      {status === 'completed' && (
        <>
          <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
          <h1 className="text-2xl font-semibold text-gray-800 mb-2">Payment Successful!</h1>
          <p className="text-gray-600 mb-6">{message}</p>
          {/* TODO: Fetch and display order details/summary? */}
          {orderId && <p className="text-sm text-gray-500 mb-4">Order ID: {orderId}</p>}
          <p className="text-sm text-gray-500 mb-4">Redirecting you to the confirmation page...</p>
          <div className="flex space-x-4">
            <Button asChild>
              <Link href="/checkout/thank-you">Continue</Link>
            </Button>
          </div>
        </>
      )}

      {status === 'failed' && (
        <>
          <XCircle className="h-16 w-16 text-red-500 mb-4" />
          <h1 className="text-2xl font-semibold text-gray-800 mb-2">Payment Failed</h1>
          <p className="text-gray-600 mb-6">{message}</p>
          <div className="flex space-x-4">
            <Button variant="outline" onClick={() => router.push('/checkout')}>Try Again</Button>
            <Button variant="ghost" onClick={() => router.push('/contact')}>Contact Support</Button>
          </div>
        </>
      )}

      {status === 'error' && (
        <>
          <AlertTriangle className="h-16 w-16 text-yellow-500 mb-4" />
          <h1 className="text-2xl font-semibold text-gray-800 mb-2">Verification Error</h1>
          <p className="text-gray-600 mb-6">{message}</p>
           <Button variant="outline" asChild>
              <Link href="/">Go Home</Link>
            </Button>
        </>
      )}
    </div>
  );
}


// Use Suspense for client components that use searchParams
export default function CheckoutCompletePage() {
    return (
        <Suspense fallback={<div className="container mx-auto p-4 py-16 flex flex-col items-center text-center"><Loader2 className="h-16 w-16 text-zervia-600 animate-spin"/></div>}>
            <CheckoutCompleteContent />
        </Suspense>
    );
} 