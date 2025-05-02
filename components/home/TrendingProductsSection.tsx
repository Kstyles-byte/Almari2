"use client"; // Convert to Client Component

import React, { useState, useEffect } from 'react'; // Import useState & useEffect
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Star, ShoppingCart } from 'lucide-react'; // Added ShoppingCart
import { Button } from '../ui/button';
import { getProducts } from '@/actions/products'; // Import getProducts
import { addToCart } from '../../actions/cart'; // Import the action
import { toast } from 'sonner'; // Import toast

// Define Product type based on the actual data structure returned by getProducts
// and used within this component/passed to handleAddToCart.
// Note: getProducts returns `reviews` (count) not `reviewCount`.
// It also returns `category` name.
interface TrendingProduct {
  id: string;
  name: string;
  price: number;
  image: string;
  rating: number;
  reviews: number; // Match getProducts output
  vendor: string;
  slug: string;
  category: string; // Match getProducts output
  inventory: number; // Need inventory for cart button state
  // isNew is not directly returned by getProducts, but can be derived or added if needed
}

// Component now fetches data client-side.
const TrendingProductsSection = () => {
  // State for products and loading/error
  const [trendingProducts, setTrendingProducts] = useState<TrendingProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState<string | null>(null); // Track loading state for add to cart

  // Fetch data on component mount
  React.useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        // Use getProducts sorted by newest
        const result = await getProducts({ sortBy: 'newest', limit: 3 }); 
        if (result.products) {
            // Map the result from getProducts to TrendingProduct type
            const formattedProducts = result.products.map((p: any) => ({
                id: p.id,
                name: p.name,
                price: p.price,
                image: p.image || '/placeholder-product.jpg', 
                rating: p.rating ?? 0, 
                reviews: p.reviews ?? 0, // Use the reviews count field
                vendor: p.vendor || 'Unknown Vendor', 
                slug: p.slug || '#', 
                category: p.category || 'Uncategorized', 
                inventory: p.inventory ?? 0 // Assuming getProducts includes inventory
            }));
           setTrendingProducts(formattedProducts as TrendingProduct[]);
        } else {
           setTrendingProducts([]);
        }
        setError(null);
      } catch (err) {
        console.error("Failed to fetch trending products:", err);
        setError("Could not load trending products.");
        setTrendingProducts([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // Add to Cart Handler
  const handleAddToCart = async (productId: string, productName: string, inventory: number) => {
    if (inventory <= 0) {
        toast.error("This product is out of stock.");
        return;
    }
    setIsAdding(productId);
    try {
      const result = await addToCart({ productId, quantity: 1 });
      if (result.success) {
        toast.success(`${productName} added to cart!`);
        // Dispatch custom event to notify header about cart update
        window.dispatchEvent(new Event('cart-updated'));
      } else {
        toast.error(result.error || 'Could not add item to cart.');
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
      toast.error("An unexpected error occurred.");
    } finally {
      setIsAdding(null);
    }
  };

  return (
    <section className="py-16 bg-zervia-50">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-zervia-900">Trending Now</h2>
            <p className="text-zervia-600 mt-2">See what's popular on campus this week</p>
          </div>
          <Link
            href="/products?sort=newest" // Changed sort param to newest
            className="inline-flex items-center text-zervia-600 font-medium mt-4 md:mt-0 hover:text-zervia-700 transition-colors"
          >
            View All Trending <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>

        {isLoading ? (
          <div className="text-center py-12">Loading trending products...</div> 
        ) : error ? (
           <div className="text-center py-12 text-red-600">{error}</div>
        ) : trendingProducts.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Re-inserting content step-by-step */} 
            {trendingProducts.map((product, index) => (
              <div key={product.id} className="group relative bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow">
                 {/* Start Re-inserting */}
                 <div className="flex flex-col md:flex-row h-full"> {/* Inner flex container */}
                     
                   {/* Image Section */}
                   <div className="relative md:w-2/5 h-48 md:h-auto overflow-hidden">
                     <Link href={`/product/${product.slug}`} className="block h-full w-full">
                       <Image
                         src={product.image}
                         alt={product.name}
                         fill
                         className="object-cover transition-transform group-hover:scale-105"
                         priority={index < 3}
                         sizes="(max-width: 1024px) 100vw, 40vw"
                       />
                     </Link>
                     {/* Overlays */}
                     <div className="absolute top-3 left-3 bg-white/90 text-zervia-600 px-3 py-1 rounded-full text-sm font-medium">
                       Trending
                     </div>
                     {product.inventory <= 0 && (
                       <div className="absolute top-3 right-3 bg-red-100 text-red-600 px-3 py-1 rounded-full text-sm font-medium">
                         Out of Stock
                       </div>
                     )}
                   </div> {/* Closing Image Section */}
                 
                   {/* Details Section */}
                   <div className="p-5 flex flex-col md:w-3/5">
                     <div className="mb-2">
                       <Link href={`/products?category=${product.category.toLowerCase().replace(/\s+/g, '-')}`}>
                         <span className="text-xs text-zervia-500 uppercase tracking-wider">{product.category}</span>
                       </Link>
                     </div>
                     <Link href={`/product/${product.slug}`} className="group">
                       <h3 className="font-medium text-lg text-zervia-900 group-hover:text-zervia-600 transition-colors mb-2 line-clamp-2">
                         {product.name}
                       </h3>
                     </Link>
                     <p className="text-sm text-zervia-500 mb-2">{product.vendor}</p>
                     <div className="flex items-center mb-3">
                       <div className="flex">
                         {[...Array(5)].map((_, i) => (
                           <Star
                             key={i}
                             className={`h-4 w-4 ${i < Math.floor(product.rating) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
                           />
                         ))}
                       </div>
                       <span className="text-xs text-zervia-500 ml-1">
                         ({product.reviews})
                       </span>
                     </div>
                     {/* Price and Button Section (at the bottom) */}
                     <div className="mt-auto flex items-center justify-between">
                       {/* Using NGN instead of ₦ temporarily */}
                       <span className="text-lg font-bold text-zervia-900">NGN {product.price.toFixed(2)}</span>
                       <Button
                         variant="default"
                         size="sm"
                         onClick={() => handleAddToCart(product.id, product.name, product.inventory)}
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
                     </div> {/* Closing Price/Button Section */}
                   </div> {/* Closing Details Section */}
                 
                 </div> {/* Closing Inner flex container */}
                 {/* End Re-inserting */}
              </div> 
            ))}
          </div>
        ) : (
           <div className="text-center py-12">
              <p className="text-zervia-600">No trending products found right now. Check back later!</p>
            </div>
        )}
      </div>
    </section>
  );
};

export default TrendingProductsSection; 