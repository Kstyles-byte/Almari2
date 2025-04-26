"use client"

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, ShoppingCart, Star } from 'lucide-react';

interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
  slug: string;
  vendor: string;
  rating: number;
  reviews: number;
}

interface RecentlyViewedProductsProps {
  products: Product[];
  title?: string;
}

export function RecentlyViewedProducts({ 
  products, 
  title = "Recently Viewed Products" 
}: RecentlyViewedProductsProps) {
  if (!products || products.length === 0) {
    return null;
  }

  return (
    <div className="mt-12 bg-white rounded-xl p-6 shadow-sm">
      <h2 className="text-xl font-semibold mb-6">{title}</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {products.map((product) => (
          <Card key={product.id} className="group overflow-hidden">
            <div className="relative">
              <Link href={`/product/${product.slug}`}>
                <div className="relative h-40 w-full overflow-hidden">
                  <Image
                    src={product.image || '/images/placeholder.jpg'}
                    alt={product.name}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                  />
                </div>
              </Link>
              <div className="absolute top-2 right-2">
                <Button size="icon" variant="outline" className="h-7 w-7 rounded-full bg-white opacity-90 hover:opacity-100">
                  <Heart className="h-3.5 w-3.5 text-zervia-600" />
                </Button>
              </div>
            </div>
            <div className="p-3">
              <Link href={`/product/${product.slug}`} className="group">
                <h3 className="font-medium text-sm text-zervia-900 group-hover:text-zervia-600 transition-colors line-clamp-1">
                  {product.name}
                </h3>
              </Link>
              <p className="text-xs text-zervia-500 mt-0.5">{product.vendor}</p>
              <div className="flex items-center mt-1">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-3 w-3 ${
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
              <div className="flex items-center justify-between mt-2">
                <div className="font-semibold text-sm text-zervia-900">${product.price.toFixed(2)}</div>
                <Button size="sm" variant="ghost" className="h-7 p-0 text-zervia-600 hover:text-zervia-800 hover:bg-transparent">
                  <ShoppingCart className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
} 