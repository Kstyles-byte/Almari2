import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, ShoppingCart, Heart, Star } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardFooter } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { getFeaturedProducts } from '../../actions/products';

// Define Product type based on what getFeaturedProducts returns
interface Product {
  id: string;
  name: string;
  price: number;
  comparePrice: number | null;
  image: string;
  rating: number;
  reviews: number;
  isNew: boolean;
  vendor: string;
  slug: string;
  category: string;
}

// Product Card Component
const ProductCard = ({ product }: { product: Product }) => {
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
            {product.comparePrice && (
              <p className="text-sm text-gray-500 line-through ml-2">${product.comparePrice.toFixed(2)}</p>
            )}
          </div>
        </div>
        <Button size="sm" variant="ghost" className="p-0 h-8 w-8 rounded-full hover:bg-zervia-100">
          <ShoppingCart className="h-4 w-4 text-zervia-600" />
        </Button>
      </CardFooter>
    </Card>
  );
};

const ProductShowcase = async () => {
  // Fetch featured products from database
  const featuredProducts = await getFeaturedProducts(8);
  
  // Get bestsellers and new arrivals by reusing the fetched products and filtering/sorting
  const bestsellers = [...featuredProducts]
    .sort((a, b) => b.reviews - a.reviews)
    .slice(0, 8);
    
  const newArrivals = featuredProducts.filter(product => product.isNew).slice(0, 8);

  return (
    <section className="py-16 bg-zervia-50">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-zervia-900">Featured Products</h2>
            <p className="text-zervia-600 mt-2">Discover our handpicked selection of products</p>
          </div>
          <Link
            href="/products"
            className="inline-flex items-center text-zervia-600 font-medium mt-4 md:mt-0 hover:text-zervia-700 transition-colors"
          >
            View All Products <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>

        <Tabs defaultValue="featured" className="w-full">
          <TabsList className="mb-8 bg-transparent">
            <TabsTrigger value="featured">Featured</TabsTrigger>
            <TabsTrigger value="bestsellers">Best Sellers</TabsTrigger>
            <TabsTrigger value="newArrivals">New Arrivals</TabsTrigger>
          </TabsList>
          
          <TabsContent value="featured" className="mt-0">
            {featuredProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {featuredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-zervia-600">No featured products found. Check back soon!</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="bestsellers" className="mt-0">
            {bestsellers.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {bestsellers.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-zervia-600">No bestselling products found. Check back soon!</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="newArrivals" className="mt-0">
            {newArrivals.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {newArrivals.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-zervia-600">No new arrivals found. Check back soon!</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
};

export default ProductShowcase; 