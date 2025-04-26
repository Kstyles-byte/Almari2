import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, ShoppingCart, Star } from 'lucide-react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';

interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
  rating: number;
  reviews: number;
  isNew?: boolean;
  vendor: string;
  slug: string;
}

interface ProductGridProps {
  products: Product[];
  view: 'grid' | 'list';
  onAddToCart?: (productId: number) => void;
  onAddToWishlist?: (productId: number) => void;
}

export function ProductGrid({ products, view, onAddToCart, onAddToWishlist }: ProductGridProps) {
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

  if (view === 'list') {
    return (
      <div className="space-y-4">
        {products.map((product) => (
          <Card key={product.id} className="overflow-hidden">
            <div className="flex flex-col sm:flex-row">
              <div className="relative w-full sm:w-48 h-48">
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  className="object-cover"
                />
                {product.isNew && (
                  <Badge className="absolute top-2 left-2 bg-zervia-600">New</Badge>
                )}
              </div>
              <div className="p-4 flex flex-col flex-1">
                <div className="mb-auto">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-lg text-zervia-900">
                        <Link href={`/product/${product.slug}`} className="hover:text-zervia-600 transition-colors">
                          {product.name}
                        </Link>
                      </h3>
                      <p className="text-sm text-zervia-500 mb-2">By {product.vendor}</p>
                    </div>
                    <p className="font-semibold text-zervia-900">${product.price.toFixed(2)}</p>
                  </div>
                  
                  <div className="flex items-center mt-2">
                    <div className="flex items-center">
                      <Star className="w-4 h-4 fill-zervia-500 text-zervia-500" />
                      <span className="ml-1 text-sm font-medium text-zervia-700">{product.rating}</span>
                    </div>
                    <span className="mx-2 text-zervia-300">•</span>
                    <span className="text-sm text-zervia-500">{product.reviews} reviews</span>
                  </div>
                </div>
                
                <div className="flex items-center mt-4 space-x-2">
                  <Button 
                    variant="default" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => onAddToCart?.(product.id)}
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Add to Cart
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => onAddToWishlist?.(product.id)}
                  >
                    <Heart className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {products.map((product) => (
        <Card key={product.id} className="overflow-hidden flex flex-col h-full">
          <div className="relative w-full pt-[100%]">
            <Image
              src={product.image}
              alt={product.name}
              fill
              className="object-cover"
            />
            {product.isNew && (
              <Badge className="absolute top-2 left-2 bg-zervia-600">New</Badge>
            )}
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute top-2 right-2 bg-white/80 hover:bg-white"
              onClick={() => onAddToWishlist?.(product.id)}
            >
              <Heart className="w-4 h-4" />
            </Button>
          </div>
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
                  <Star className="w-4 h-4 fill-zervia-500 text-zervia-500" />
                  <span className="ml-1 text-sm font-medium text-zervia-700">{product.rating}</span>
                </div>
                <span className="mx-1 text-zervia-300">•</span>
                <span className="text-sm text-zervia-500">{product.reviews} reviews</span>
              </div>
              
              <p className="font-semibold text-zervia-900 mt-2">${product.price.toFixed(2)}</p>
            </div>
            
            <Button 
              variant="default" 
              size="sm" 
              className="mt-4 w-full"
              onClick={() => onAddToCart?.(product.id)}
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              Add to Cart
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
} 