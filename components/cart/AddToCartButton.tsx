'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';
import { useCartActions } from '@/hooks/useCart';

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
  const { add } = useCartActions();
  const [loading, setLoading] = React.useState(false);

  const handleAddToCart = async () => {
    setLoading(true);
    try {
      add(productId, 1);
      toast.success(`${productName} added to cart!`);
    } catch {
      toast.error('Failed to add item to cart');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleAddToCart}
      isLoading={loading}
      loadingText="Adding..."
    >
      <ShoppingCart className="mr-2 h-4 w-4" />
      Add to Cart
    </Button>
  );
} 