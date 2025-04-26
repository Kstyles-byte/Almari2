"use client"

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, ArrowLeft, Printer, Copy, Clipboard, ClipboardCheck } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import confetti from 'canvas-confetti';

export default function ReturnSuccessPage() {
  const searchParams = useSearchParams();
  const returnId = searchParams.get('id') || 'RET-12345';
  const [isCopied, setIsCopied] = useState(false);
  
  useEffect(() => {
    // Trigger confetti animation on page load
    const duration = 2000;
    const end = Date.now() + duration;
    
    (function frame() {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#4F46E5', '#7C3AED', '#EC4899']
      });
      
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#4F46E5', '#7C3AED', '#EC4899']
      });
      
      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();
  }, []);
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(returnId);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };
  
  return (
    <div className="container max-w-2xl mx-auto px-4 py-12">
      <Link href="/customer/returns" className="flex items-center text-zervia-600 hover:text-zervia-700 mb-6">
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to Returns Dashboard
      </Link>
      
      <div className="flex flex-col items-center mb-8 text-center">
        <CheckCircle2 className="h-20 w-20 text-green-500 mb-4" />
        <h1 className="text-3xl font-bold mb-2">Return Request Submitted</h1>
        <p className="text-zervia-500 text-lg">
          Your return request has been successfully submitted!
        </p>
      </div>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Return Details</CardTitle>
          <CardDescription>
            Keep your return ID for reference and tracking
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-zervia-500 block mb-1">
              Return ID
            </label>
            <div className="flex items-center">
              <div className="bg-zervia-50 px-4 py-3 rounded-l-md border border-r-0 border-zervia-200 flex-1">
                <code className="font-mono text-zervia-800">{returnId}</code>
              </div>
              <button
                onClick={copyToClipboard}
                className="flex items-center justify-center bg-zervia-100 hover:bg-zervia-200 px-3 py-3 rounded-r-md border border-zervia-200 transition-colors"
              >
                {isCopied ? (
                  <ClipboardCheck className="h-4 w-4 text-green-600" />
                ) : (
                  <Clipboard className="h-4 w-4 text-zervia-700" />
                )}
              </button>
            </div>
          </div>
          
          <Separator />
          
          <div>
            <h3 className="text-sm font-medium mb-2">What's Next?</h3>
            <ol className="list-decimal ml-5 text-sm space-y-2">
              <li>
                <span className="font-medium">Check your email</span> - We've sent a confirmation 
                with complete details and instructions to your registered email address.
              </li>
              <li>
                <span className="font-medium">Print return label</span> - Within 24 hours, you'll 
                receive a prepaid return shipping label via email.
              </li>
              <li>
                <span className="font-medium">Package your items</span> - Place the items in their 
                original packaging if possible.
              </li>
              <li>
                <span className="font-medium">Ship your return</span> - Attach the shipping label to 
                your package and drop it off at any authorized shipping location.
              </li>
              <li>
                <span className="font-medium">Track your return</span> - You can check the status of 
                your return on the Returns Dashboard.
              </li>
            </ol>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row sm:justify-between gap-3">
          <Button
            variant="outline"
            className="w-full sm:w-auto"
            onClick={() => window.print()}
          >
            <Printer className="h-4 w-4 mr-2" />
            Print Confirmation
          </Button>
          <Button asChild className="w-full sm:w-auto">
            <Link href="/customer/returns">View All Returns</Link>
          </Button>
        </CardFooter>
      </Card>
      
      <div className="bg-zervia-50 border border-zervia-200 rounded-lg p-4">
        <h3 className="font-medium mb-2">Need Help?</h3>
        <p className="text-sm text-zervia-600 mb-4">
          If you have any questions or concerns about your return, our customer 
          service team is available to assist you.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button variant="outline" asChild className="text-sm" size="sm">
            <Link href="/help/contact">Contact Support</Link>
          </Button>
          <Button variant="link" asChild className="text-sm" size="sm">
            <Link href="/help/returns-faq">Return FAQs</Link>
          </Button>
        </div>
      </div>
    </div>
  );
} 