"use client";

import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import { cancelOrder } from '@/actions/orders';
import { toast } from '@/components/ui/use-toast';
import { useRouter } from 'next/navigation';

interface CancelOrderFormProps {
  orderId: string;
}

export function CancelOrderForm({ orderId }: CancelOrderFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  
  const handleCancel = async (formData: FormData) => {
    setIsLoading(true);
    
    try {
      const result = await cancelOrder(formData);
      
      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Order Cancelled",
          description: "Your order has been successfully cancelled.",
        });
        router.refresh();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <form action={handleCancel}>
      <input type="hidden" name="orderId" value={orderId} />
      <Button 
        type="submit"
        variant="outline" 
        className="gap-2 border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            Cancelling...
          </>
        ) : (
          <>
            <AlertTriangle className="h-4 w-4" />
            Cancel Order
          </>
        )}
      </Button>
    </form>
  );
} 