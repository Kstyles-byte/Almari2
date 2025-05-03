import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CreditCard, Wallet } from 'lucide-react';
import { createOrder } from '@/actions/orders';
import { useState } from 'react';

interface CheckoutPaymentFormProps {
  amount: number;
  email: string;
  contactInfo: FormData;
  onPaymentInit: () => void;
  onPaymentComplete: (reference: string) => void;
  onBack: () => void;
}

export function CheckoutPaymentForm({
  amount,
  email,
  contactInfo,
  onPaymentInit,
  onPaymentComplete,
  onBack
}: CheckoutPaymentFormProps) {
  const [paymentMethod, setPaymentMethod] = React.useState<'card' | 'wallet'>('card');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handlePayment = async () => {
    onPaymentInit();
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await createOrder(contactInfo);
      
      if (result.error) {
        setError(result.error);
        setIsLoading(false);
      } else if ('success' in result && result.success && result.payment?.authorizationUrl) {
        window.location.href = result.payment.authorizationUrl;
      } else if ('error' in result && result.error) {
        setError(result.error);
        setIsLoading(false);
      } else {
        setError("Could not initialize payment or unexpected response. Please try again.");
        setIsLoading(false);
      }
    } catch (err) {
      console.error("Error calling createOrder action:", err);
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
      setIsLoading(false);
    }
  };
  
  return (
    <Card className="bg-white shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Payment Information</CardTitle>
        <p className="text-sm text-gray-500">Secure payment processed by Paystack</p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <Label>Select Payment Method</Label>
          <RadioGroup
            value={paymentMethod}
            onValueChange={(value) => setPaymentMethod(value as 'card' | 'wallet')}
            className="space-y-3"
          >
            <div className={`border rounded-lg p-4 transition-colors ${
              paymentMethod === 'card' ? 'border-zervia-600 bg-zervia-50' : 'border-gray-200'
            }`}>
              <RadioGroupItem
                value="card"
                id="payment-card"
                className="sr-only"
              />
              <Label
                htmlFor="payment-card"
                className="flex items-center cursor-pointer"
              >
                <CreditCard className={`h-5 w-5 mr-2 ${paymentMethod === 'card' ? 'text-zervia-600' : 'text-gray-400'}`} />
                <span>Credit/Debit Card</span>
              </Label>
            </div>
            
            <div className={`border rounded-lg p-4 transition-colors ${
              paymentMethod === 'wallet' ? 'border-zervia-600 bg-zervia-50' : 'border-gray-200'
            }`}>
              <RadioGroupItem
                value="wallet"
                id="payment-wallet"
                className="sr-only"
              />
              <Label
                htmlFor="payment-wallet"
                className="flex items-center cursor-pointer"
              >
                <Wallet className={`h-5 w-5 mr-2 ${paymentMethod === 'wallet' ? 'text-zervia-600' : 'text-gray-400'}`} />
                <span>Paystack Wallet</span>
              </Label>
            </div>
          </RadioGroup>
        </div>
        
        {paymentMethod === 'card' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cardNumber">Card Number</Label>
              <Input
                id="cardNumber"
                placeholder="1234 5678 9012 3456"
                className="font-mono"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expiryDate">Expiry Date</Label>
                <Input
                  id="expiryDate"
                  placeholder="MM/YY"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cvv">CVV</Label>
                <Input
                  id="cvv"
                  placeholder="123"
                  type="password"
                  maxLength={4}
                />
              </div>
            </div>
          </div>
        )}
        
        <div className="pt-2 text-sm text-gray-500">
          <p>Amount to be charged: <span className="font-medium text-gray-900">₦{amount.toFixed(2)}</span></p>
          <p>Receipt will be sent to: <span className="font-medium text-gray-900">{email}</span></p>
        </div>
        
        {error && (
          <p className="text-sm text-red-600 text-center">Error: {error}</p>
        )}
        
        <div className="space-y-2 pt-4">
          <Button
            className="w-full bg-zervia-600 hover:bg-zervia-700 text-white"
            onClick={handlePayment}
            isLoading={isLoading}
            loadingText="Processing..."
          >
            Pay NGN {amount.toFixed(2)}
          </Button>
          
          <Button
            variant="outline"
            className="w-full"
            type="button"
            onClick={onBack}
          >
            Back to Pickup Location
          </Button>
        </div>
        
        <div className="flex items-center justify-center pt-2">
          <svg className="h-6 w-auto mr-2" viewBox="0 0 85 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M13.7127 0H7.0448V17.5155H13.7127V0Z" fill="#00C3F7"/>
            <path d="M5.09502 0H0V17.5155H5.09502V0Z" fill="#00C3F7"/>
            <path d="M34.0449 0H25.5132V17.5155H30.6018V11.8167H34.0449C38.2538 11.8167 41.193 9.63143 41.193 5.9036C41.193 2.17577 38.2538 0 34.0449 0ZM33.5546 7.40517H30.6083V4.42222H33.5546C34.8732 4.42222 35.635 5.11143 35.635 5.9036C35.635 6.71622 34.8732 7.40517 33.5546 7.40517Z" fill="#00C3F7"/>
            <path d="M63.4036 6.69576C61.6848 6.14608 60.7171 5.82824 60.7171 5.11111C60.7171 4.51025 61.2779 4.12203 62.223 4.12203C63.8522 4.12203 65.4936 4.73585 66.8896 5.70108L69.3038 2.03094C67.4093 0.611225 64.8953 0 62.223 0C58.4142 0 55.4987 2.1757 55.4987 5.37967C55.4987 8.50322 57.7878 9.90293 60.7613 10.7566C62.4478 11.2795 63.5208 11.6107 63.5208 12.4437C63.5208 13.1124 62.8927 13.4845 61.7917 13.4845C59.8255 13.4845 57.896 12.6516 56.4377 11.4828L54 15.0708C56.0173 16.7788 58.8984 17.5155 61.7024 17.5155C65.7667 17.5155 68.7756 15.7639 68.7756 12.1535C68.782 8.87098 66.3355 7.41247 63.4036 6.69576Z" fill="#011B33"/>
            <path d="M85 0H80.4696L75.6296 6.7895H74.0511V0H68.9624V17.5152H74.0511V11.1883H75.7767L80.9027 17.5152H85.643L78.9693 9.23008L85 0Z" fill="#011B33"/>
            <path d="M44.357 0V17.5155H54.7823V13.2151H49.4455V0H44.357Z" fill="#011B33"/>
            <path d="M28.9329 22.5342C28.0952 22.5342 27.4161 22.6893 26.9322 22.9998C26.4482 23.31 26.2068 23.7497 26.2068 24.3178C26.2068 24.8858 26.4482 25.3253 26.9322 25.6358C27.4161 25.9463 28.0952 26.1012 28.9329 26.1012C29.7708 26.1012 30.4524 25.9463 30.9363 25.6358C31.4203 25.3253 31.6617 24.8858 31.6617 24.3178C31.6617 23.7497 31.4203 23.31 30.9363 22.9998C30.4524 22.6893 29.7708 22.5342 28.9329 22.5342Z" fill="#00C3F7"/>
            <path d="M6.30187 19.9033C5.40536 19.9033 4.68318 20.0701 4.13562 20.403C3.58806 20.7359 3.31445 21.1951 3.31445 21.7789C3.31445 22.3626 3.58806 22.8218 4.13562 23.1547C4.68318 23.4876 5.40536 23.6544 6.30187 23.6544C7.19838 23.6544 7.92119 23.4876 8.46825 23.1547C9.01587 22.8218 9.28961 22.3626 9.28961 21.7789C9.28961 21.1951 9.01587 20.7359 8.46825 20.403C7.92119 20.0701 7.19838 19.9033 6.30187 19.9033Z" fill="#00C3F7"/>
            <path d="M18.8803 19.9033C17.9838 19.9033 17.2616 20.0701 16.714 20.403C16.1664 20.7359 15.8928 21.1951 15.8928 21.7789C15.8928 22.3626 16.1664 22.8218 16.714 23.1547C17.2616 23.4876 17.9838 23.6544 18.8803 23.6544C19.7768 23.6544 20.4996 23.4876 21.0468 23.1547C21.5944 22.8218 21.8681 22.3626 21.8681 21.7789C21.8681 21.1951 21.5944 20.7359 21.0468 20.403C20.4996 20.0701 19.7768 19.9033 18.8803 19.9033Z" fill="#00C3F7"/>
          </svg>
        </div>
      </CardContent>
    </Card>
  );
}