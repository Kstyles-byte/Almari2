'use client'; // Make it a client component to fetch data

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, ShoppingCart, Heart, Star } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardFooter } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { getProducts } from '@/actions/products';
import { ProductGrid } from '../products/product-grid';
import type { Product as ProductGridItemType } from '../products/product-grid'; // Use type from ProductGrid

// Define Product type matching ProductGrid expectation
interface ShowcaseProduct {
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
}

// Product Card Component
const ProductCard = ({ product }: { product: ShowcaseProduct }) => {
  return (
    <Card className="group h-full flex flex-col">
      <div className="relative overflow-hidden">
        <Link href={`/product/${product.slug}`}>
          <div className="relative h-60 w-full overflow-hidden">
            <Image
              src={product.image}
              alt={product.name}
              fill
              className="object-cover transition-transform group-hover:scale-105"
            />
          </div>
        </Link>
        {product.isNew && (
          <Badge className="absolute top-3 left-3 bg-zervia-600">New</Badge>
        )}
        <div className="absolute top-3 right-3 space-y-2">
          <Button size="icon" variant="outline" className="h-8 w-8 rounded-full bg-white opacity-90 hover:opacity-100">
            <Heart className="h-4 w-4 text-zervia-600" />
          </Button>
        </div>
      </div>
      
      <CardContent className="flex-grow pt-4">
        <div className="mb-1">
          <p className="text-sm text-zervia-600">{product.vendor}</p>
        </div>
        <Link href={`/product/${product.slug}`} className="block">
          <h3 className="font-medium text-zervia-900 line-clamp-2 h-12 hover:text-zervia-600 transition-colors">
            {product.name}
          </h3>
        </Link>
        <div className="flex items-center mt-1">
          <div className="flex items-center">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                size={14}
                className={star <= Math.round(product.rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}
              />
            ))}
          </div>
          <span className="text-xs text-zervia-500 ml-1">({product.reviews})</span>
        </div>
      </CardContent>
      
      <CardFooter className="flex items-center justify-between pt-0">
        <div>
          <div className="flex items-center">
            <p className="font-semibold text-lg text-zervia-900">${product.price.toFixed(2)}</p>
          </div>
        </div>
        <Button size="sm" variant="ghost" className="p-0 h-8 w-8 rounded-full hover:bg-zervia-100">
          <ShoppingCart className="h-4 w-4 text-zervia-600" />
        </Button>
      </CardFooter>
    </Card>
  );
};

// Component for loading state (Skeleton)
const ProductShowcaseSkeleton = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
    {[...Array(8)].map((_, i) => (
      <div key={i} className="border rounded-lg p-4 space-y-3 animate-pulse">
        <div className="aspect-square bg-gray-200 rounded-md"></div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          <div className="h-5 bg-gray-200 rounded w-1/4"></div>
        </div>
        <div className="h-8 bg-gray-200 rounded w-full"></div>
      </div>
    ))}
  </div>
);

const ProductShowcase = () => {
  // State uses the type defined/exported by ProductGrid
  const [products, setProducts] = useState<ProductGridItemType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Fetch newest products using getProducts
        const result = await getProducts({ sortBy: 'newest', limit: 8 }); 
        if (result.products) {
           // Assume the structure from getProducts matches ProductGridItemType
           // If not, mapping/adjustment is needed here.
           setProducts(result.products as ProductGridItemType[]); 
        } else {
           // Handle case where products array might be missing, though action should return it
           setProducts([]);
           // Consider setting an error if appropriate
        }
      } catch (err) {
        console.error("Failed to fetch products for showcase:", err);
        setError("Could not load products.");
        setProducts([]); // Clear products on error
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // Use the fetched 'newest' products for both tabs for now
  // TODO: Implement proper bestseller logic when sales data is available
  const newArrivals = products;
  const bestsellers = products; // Placeholder

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-zervia-900 mb-8 text-center">
          Explore Our Collection
        </h2>
        
        <Tabs defaultValue="new-arrivals" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:w-1/2 mx-auto mb-8">
            <TabsTrigger value="new-arrivals">New Arrivals</TabsTrigger>
            <TabsTrigger value="bestsellers">Bestsellers</TabsTrigger>
          </TabsList>

          {isLoading ? (
            <ProductShowcaseSkeleton />
          ) : error ? (
            <div className="text-center py-12 text-red-600">{error}</div>
          ) : (
            <>
              <TabsContent value="new-arrivals">
                {newArrivals.length > 0 ? (
                  <ProductGrid products={newArrivals} />
                ) : (
                   <p className="text-center text-gray-500 py-8">No new arrivals found.</p>
                )}
              </TabsContent>
              <TabsContent value="bestsellers">
                 {bestsellers.length > 0 ? (
                    <ProductGrid products={bestsellers} />
                 ) : (
                    <p className="text-center text-gray-500 py-8">No bestsellers found.</p>
                 )}
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>
    </section>
  );
};

export default ProductShowcase; 