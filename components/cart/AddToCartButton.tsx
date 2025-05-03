'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { ShoppingCart } from 'lucide-react';
import { useCustomLoader } from '@/hooks/useCustomLoader';
import { ActionLoader } from '@/components/ui/loader';
import { toast } from 'sonner';

interface AddToCartButtonProps {
  productId: string;
  productName: string;
  variant?: 'default' | 'secondary' | 'outline';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
}

export function AddToCartButton({
  productId,
  productName,
  variant = 'default',
  size = 'default',
  className,
}: AddToCartButtonProps) {
  const {
    startButtonLoading,
    stopButtonLoading,
    isButtonLoadingById,
    startActionLoading,
    stopActionLoading,
    isActionLoading,
    actionLoadingText
  } = useCustomLoader();
  
  const buttonId = `add-to-cart-${productId}`;
  
  const handleAddToCart = async () => {
    // Start button loading state
    startButtonLoading(buttonId);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 600));
      
      // Show processing loader
      startActionLoading(`Adding ${productName} to your cart...`);
      
      // Simulate adding to cart
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Show success
      stopActionLoading();
      toast.success(`${productName} added to cart!`);
    } catch (error) {
      toast.error('Failed to add item to cart');
    } finally {
      stopButtonLoading(buttonId);
    }
  };
  
  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={handleAddToCart}
        isLoading={isButtonLoadingById(buttonId)}
        loadingText="Adding..."
      >
        <ShoppingCart className="mr-2 h-4 w-4" />
        Add to Cart
      </Button>
      
      {isActionLoading && (
        <ActionLoader text={actionLoadingText} />
      )}
    </>
  );
} 