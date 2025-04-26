"use client"

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Trash2, ShoppingCart, Star } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  image: string;
  vendor: string;
  rating: number;
  reviews: number;
  inStock: boolean;
}

interface WishlistItemProps {
  product: Product;
  onRemove: (id: string) => void;
  onAddToCart: (id: string) => void;
}

export function WishlistItem({ product, onRemove, onAddToCart }: WishlistItemProps) {
  return (
    <div className="flex items-start gap-4 p-4 bg-white rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="relative w-24 h-24 sm:w-32 sm:h-32 flex-shrink-0">
        <Image
          src={product.image}
          alt={product.name}
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
          <div className="font-semibold text-lg text-zervia-900">${product.price.toFixed(2)}</div>
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
          onClick={() => onRemove(product.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
        
        <Button 
          size="sm" 
          className="bg-zervia-600 hover:bg-zervia-700"
          disabled={!product.inStock}
          onClick={() => onAddToCart(product.id)}
        >
          <ShoppingCart className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
} 