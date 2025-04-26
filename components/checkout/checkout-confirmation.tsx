import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Copy } from 'lucide-react';
import Link from 'next/link';

interface CheckoutConfirmationProps {
  orderNumber: string;
  pickupCode: string;
  agentLocation: string;
  agentAddress: string;
  customerEmail: string;
}

export function CheckoutConfirmation({
  orderNumber,
  pickupCode,
  agentLocation,
  agentAddress,
  customerEmail,
}: CheckoutConfirmationProps) {
  const [copied, setCopied] = React.useState(false);
  
  const handleCopyCode = () => {
    navigator.clipboard.writeText(pickupCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    });
  };
  
  return (
    <Card className="bg-white shadow-sm">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
          <CheckCircle className="h-10 w-10 text-green-600" />
        </div>
        <CardTitle className="text-2xl font-semibold text-zervia-900">Order Confirmed!</CardTitle>
        <p className="text-sm text-gray-500">Your order has been successfully placed</p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="rounded-lg bg-zervia-50 p-4">
          <div className="mb-3 text-center">
            <h3 className="text-lg font-medium text-zervia-900">Your Pickup Code</h3>
            <p className="text-sm text-gray-600">Show this code to the agent when collecting your order</p>
          </div>
          <div className="flex items-center justify-center space-x-2">
            <code className="relative rounded bg-muted px-[0.5rem] py-[0.4rem] font-mono text-lg font-semibold">
              {pickupCode}
            </code>
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={handleCopyCode}
            >
              {copied ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              <span className="sr-only">Copy code</span>
            </Button>
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Order Number:</span>
            <span className="text-sm font-medium">{orderNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Pickup Location:</span>
            <span className="text-sm font-medium">{agentLocation}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Address:</span>
            <span className="text-sm font-medium">{agentAddress}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Confirmation Email:</span>
            <span className="text-sm font-medium">{customerEmail}</span>
          </div>
        </div>
        
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm text-amber-800">
            <strong>Important:</strong> We'll notify you when your order is ready for pickup.
            You'll have 48 hours to collect your order after it's ready.
          </p>
        </div>
        
        <div className="space-y-3 pt-2">
          <Link href="/customer/dashboard" passHref>
            <Button className="w-full bg-zervia-600 hover:bg-zervia-700 text-white">
              Go to My Dashboard
            </Button>
          </Link>
          
          <Link href="/" passHref>
            <Button variant="outline" className="w-full">
              Return to Homepage
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
} 