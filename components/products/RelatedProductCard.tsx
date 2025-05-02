'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Star, ShoppingCart } from 'lucide-react';
import { Button } from '../ui/button';
import { addToCart } from '../../actions/cart';
import { toast } from 'sonner';

interface RelatedProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  comparePrice: number | null;
  image: string;
  rating: number;
  reviewCount: number;
  inventory: number; // Need inventory for button state
}

interface RelatedProductCardProps {
  product: RelatedProduct;
}

export function RelatedProductCard({ product }: RelatedProductCardProps) {
  const [isAdding, setIsAdding] = useState(false);

  const handleAddToCart = async () => {
    setIsAdding(true);
    try {
      // Need to fetch inventory before adding? Or assume getRelatedProducts returns it.
      // For now, assume `product.inventory` is available from props.
      if (product.inventory <= 0) {
        toast.error('This product is out of stock.');
        setIsAdding(false);
        return;
      }
      
      const result = await addToCart({ productId: product.id, quantity: 1 });
      if (result.success) {
        toast.success(`${product.name} added to cart!`);
        // Dispatch custom event to notify header about cart update
        window.dispatchEvent(new Event('cart-updated'));
      } else {
        toast.error(result.error || 'Could not add item to cart.');
      }
    } catch (error) {
      console.error("Error adding related product to cart:", error);
      toast.error("An unexpected error occurred.");
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="group relative">
      <Link href={`/product/${product.slug}`}>
        <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-zervia-50 mb-4">
          <Image
            src={product.image || '/placeholder-product.jpg'}
            alt={product.name}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder-product.jpg'; }}
          />
          {product.inventory <= 0 && (
             <div className="absolute top-2 right-2 bg-red-100 text-red-600 px-2 py-0.5 rounded text-xs font-medium">
                Out of Stock
             </div>
          )}
        </div>
      </Link>
      <Link href={`/product/${product.slug}`} className="group">
        <h3 className="font-medium text-zervia-900 group-hover:text-zervia-600 transition-colors truncate">
          {product.name}
        </h3>
      </Link>
      <div className="flex items-center mt-1">
        <div className="flex">
          {[...Array(5)].map((_, i) => (
            <Star 
              key={i}
              size={12}
              className={i < Math.floor(product.rating) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}
            />
          ))}
        </div>
        <span className="ml-1 text-xs text-zervia-500">
          ({product.reviewCount})
        </span>
      </div>
      <div className="mt-2 flex justify-between items-center">
         <div className="font-medium text-zervia-900">
             {product.comparePrice && product.comparePrice > product.price ? (
                 <div className="flex items-baseline gap-1 text-sm">
                     <span className="text-zervia-900">${product.price.toFixed(2)}</span>
                     <span className="text-zervia-500 line-through">${product.comparePrice.toFixed(2)}</span>
                 </div>
                 ) : (
                     <span className="text-sm">${product.price.toFixed(2)}</span>
                 )}
         </div>
         <Button 
           variant="outline"
           size="icon"
           onClick={handleAddToCart}
           disabled={isAdding || product.inventory <= 0}
           aria-label={`Add ${product.name} to cart`}
           className="h-8 w-8"
         >
           {isAdding ? (
               <span className="animate-spin h-4 w-4">...</span>
           ) : (
               <ShoppingCart className="w-4 h-4" />
           )}
         </Button>
      </div>
    </div>
  );
} 