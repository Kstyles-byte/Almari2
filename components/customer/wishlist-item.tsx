"use client"

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Trash2, ShoppingCart, Star } from 'lucide-react';
import { useTransition } from 'react';
import { toast } from 'sonner';

interface Product {
  id?: string;
  name?: string;
  slug?: string;
  price?: number;
  image: string;
  vendor: string;
  vendorId?: string;
  rating: number;
  reviews: number;
  inStock?: boolean;
}

interface WishlistItemProps {
  product: Product;
  onRemove: (id: string) => Promise<void>;
  onAddToCart: (id: string) => Promise<void>;
}

export function WishlistItem({ product, onRemove, onAddToCart }: WishlistItemProps) {
  const [isRemoving, startRemoveTransition] = useTransition();
  const [isAddingToCart, startAddToCartTransition] = useTransition();

  const handleRemove = () => {
    if (!product.id) return;
    
    startRemoveTransition(async () => {
      try {
        await onRemove(product.id!);
        toast.success("Item removed from wishlist");
      } catch (error) {
        console.error("Failed to remove item:", error);
        toast.error("Failed to remove item from wishlist");
      }
    });
  };

  const handleAddToCart = () => {
    if (!product.id) return;
    
    startAddToCartTransition(async () => {
      try {
        await onAddToCart(product.id!);
        toast.success("Item added to cart");
      } catch (error) {
        console.error("Failed to add to cart:", error);
        toast.error("Failed to add item to cart");
      }
    });
  };

  if (!product.id || !product.name) {
    return null; // Don't render if missing essential data
  }

  return (
    <div className="flex items-start gap-4 p-4 bg-white rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="relative w-24 h-24 sm:w-32 sm:h-32 flex-shrink-0">
        <Image
          src={product.image}
          alt={product.name || "Product image"}
          fill
          className="object-cover rounded-md"
        />
      </div>
      
      <div className="flex-1 min-w-0">
        <Link href={`/product/${product.slug}`}>
          <h3 className="font-medium text-zervia-900 hover:text-zervia-600 transition-colors line-clamp-2">
            {product.name}
          </h3>
        </Link>
        
        <p className="text-sm text-zervia-500 mt-1">{product.vendor}</p>
        
        <div className="flex items-center mt-1">
          <div className="flex">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`h-3.5 w-3.5 ${
                  i < Math.floor(product.rating)
                    ? "text-yellow-400 fill-yellow-400"
                    : "text-gray-300"
                }`}
              />
            ))}
          </div>
          <span className="text-xs text-zervia-500 ml-1">
            ({product.reviews})
          </span>
        </div>
        
        <div className="flex items-center justify-between mt-3 sm:mt-4">
          <div className="font-semibold text-lg text-zervia-900">
            ₦{product.price?.toFixed(2) || "0.00"}
          </div>
          <div className="text-sm text-gray-500">
            {product.inStock ? (
              <span className="text-green-600">In Stock</span>
            ) : (
              <span className="text-red-500">Out of Stock</span>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex flex-col gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
          onClick={handleRemove}
          disabled={isRemoving}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
        
        <Button 
          size="sm" 
          className="bg-zervia-600 hover:bg-zervia-700"
          disabled={!product.inStock || isAddingToCart}
          onClick={handleAddToCart}
        >
          <ShoppingCart className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
} 