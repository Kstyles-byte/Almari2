"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, ShoppingCart, Star } from 'lucide-react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { useCartActions } from '@/hooks/useCart';
import { toast } from 'sonner';
import { WishlistButton } from '@/components/products/WishlistButton';

// Export the interface so it can be imported elsewhere
export interface Product { 
  id: string;
  name: string;
  price: number;
  image: string;
  rating: number;
  reviews: number;
  isNew?: boolean;
  vendor: string;
  slug: string;
  inventory: number;
  initialInWishlist?: boolean;
}

interface ProductGridProps {
  products: Product[];
  className?: string; // Add className prop to allow customization
  columnsOverride?: string; // Allow overriding the default grid columns
}

export function ProductGrid({ products, className, columnsOverride }: ProductGridProps) {
  const [isAdding, setIsAdding] = useState<string | null>(null);
  const { add } = useCartActions();

  const handleAddToCart = (productId: string, productName: string) => {
    setIsAdding(productId);
    try {
      add(productId, 1);
      toast.success(`${productName} added to cart!`);
    } catch (err) {
      console.error(err);
      toast.error('Could not add item to cart.');
    } finally {
      setIsAdding(null);
    }
  };

  if (products.length === 0) {
    return (
      <div className="flex items-center justify-center h-80 w-full">
        <div className="text-center">
          <p className="text-zervia-600 text-lg mb-4">No products found</p>
          <p className="text-zervia-500">Try adjusting your filters or search terms</p>
        </div>
      </div>
    );
  }

  // Default grid columns configuration with responsive breakpoints
  const defaultGridColumns = "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4";

  return (
    <div className={`grid gap-4 ${columnsOverride || defaultGridColumns} ${className || ''}`}>
      {products.map((product) => (
        <Card key={product.id} className="overflow-hidden flex flex-col h-full group relative">
          <Link href={`/product/${product.slug}`} className="block aspect-square relative">
            <Image
              src={product.image || '/placeholder-product.jpg'}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
            {product.isNew && (
              <Badge className="absolute top-2 left-2 bg-zervia-600">New</Badge>
            )}
            {product.inventory <= 0 && (
              <Badge variant="destructive" className="absolute top-2 right-2">Out of Stock</Badge>
            )}
          </Link>
          
          <WishlistButton
            productId={product.id}
            initialInWishlist={product.initialInWishlist || false}
            variant="icon"
            className="absolute top-3 right-3 z-10"
          />
          
          <div className="p-4 flex flex-col flex-grow">
            <div className="mb-auto">
              <Link href={`/product/${product.slug}`} className="block">
                <h3 className="font-medium text-zervia-900 hover:text-zervia-600 transition-colors line-clamp-2">
                  {product.name}
                </h3>
              </Link>
              <p className="text-sm text-zervia-500 mt-1">By {product.vendor}</p>
              
              <div className="flex items-center mt-2">
                <div className="flex items-center">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="ml-1 text-sm font-medium text-zervia-700">{product.rating.toFixed(1)}</span>
                </div>
                <span className="mx-1 text-zervia-300">•</span>
                <span className="text-sm text-zervia-500">({product.reviews} reviews)</span>
              </div>
              
              <p className="font-semibold text-zervia-900 mt-2">₦{product.price.toFixed(2)}</p>
            </div>
            
            <Button 
              variant="default" 
              size="sm" 
              className="mt-4 w-full"
              onClick={() => handleAddToCart(product.id, product.name)}
              disabled={isAdding === product.id || product.inventory <= 0}
              aria-disabled={isAdding === product.id || product.inventory <= 0}
            >
              {isAdding === product.id ? (
                <span className="animate-spin h-4 w-4 mr-2">...</span>
              ) : (
                <ShoppingCart className="w-4 h-4 mr-2" />
              )}
              {product.inventory > 0 ? 'Add to Cart' : 'Out of Stock'}
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
} 