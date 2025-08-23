import React, { useState, useContext } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createOrder } from '@/actions/orders';
import { toast } from 'sonner';
import { CartContext } from '@/components/providers/CartProvider';
import { clearGuestCart } from '@/lib/utils/guest-cart';

interface CheckoutPaymentFormProps {
  amount: number;
  email: string;
  contactInfo: FormData;
  onPaymentInit: () => void;
  onBack: () => void;
}

export function CheckoutPaymentForm({
  amount,
  email,
  contactInfo,
  onPaymentInit,
  onBack
}: CheckoutPaymentFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cartCtx = useContext(CartContext);
  
  const handleProceedToPayment = async () => {
    onPaymentInit();
    setIsLoading(true);
    setError(null);
    
    console.log("Client-side auth check before calling createOrder:", {
       isAuthenticatedClientSide: "NEEDS_VERIFICATION", 
    });
    
    try {
      console.log("Calling createOrder action with contactInfo:", contactInfo);
      const result = await createOrder(contactInfo);
      
      if (result.error) {
        console.error("createOrder error:", result.error);
        setError(result.error);
        toast.error(`Payment Initialization Failed: ${result.error}`);
        setIsLoading(false);
      } else if (result.success && result.payment?.authorizationUrl) {
        console.log("Order created successfully, clearing cart before payment redirect");
        
        // Clear cart immediately after successful order creation
        cartCtx?.clear();
        cartCtx?.setDiscount(0, null);
        clearGuestCart();
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem('zervia_coupon_code');
        }
        
        console.log("Redirecting to Paystack:", result.payment.authorizationUrl);
        window.location.href = result.payment.authorizationUrl;
      } else {
        console.error("Unexpected response from createOrder:", result);
        setError("Could not initialize payment. Unexpected response from server.");
        toast.error("Payment Initialization Failed: Unexpected response.");
        setIsLoading(false);
      }
    } catch (err) {
      console.error("Error calling createOrder action:", err);
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred during payment initialization.";
      setError(errorMessage);
      toast.error(`Payment Initialization Failed: ${errorMessage}`);
      setIsLoading(false);
    }
  };
  
  return (
    <Card className="bg-white shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Confirm Order & Pay</CardTitle>
        <p className="text-sm text-gray-500">You will be redirected to Paystack to complete your payment securely.</p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="pt-2 text-sm text-gray-500 border-t pt-4">
          <p>Amount to be charged: <span className="font-medium text-gray-900">₦{amount.toFixed(2)}</span></p>
          <p>Receipt will be sent to: <span className="font-medium text-gray-900">{email}</span></p>
        </div>
        
        {error && (
          <p className="text-sm text-red-600 text-center bg-red-50 p-3 rounded-md">Error: {error}</p>
        )}
        
        <div className="space-y-3 pt-4">
          <Button
            className="w-full bg-zervia-600 hover:bg-zervia-700 text-white"
            onClick={handleProceedToPayment}
            isLoading={isLoading}
            loadingText="Initializing Payment..."
            disabled={isLoading}
          >
            Proceed to Pay ₦{amount.toFixed(2)}
          </Button>
          
          <Button
            variant="outline"
            className="w-full"
            type="button"
            onClick={onBack}
            disabled={isLoading}
          >
            Back to Pickup Location
          </Button>
        </div>
        
        <div className="flex items-center justify-center pt-4 border-t mt-4">
           <span className="text-xs text-gray-500 mr-2">Secured by</span>
           <span className="font-bold text-sm" style={{ color: '#00C3F7' }}>paystack</span>
        </div>
      </CardContent>
    </Card>
  );
}