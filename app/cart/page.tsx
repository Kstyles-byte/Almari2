'use client'; // Make CartPage a client component to use state
export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useTransition, useCallback } from 'react'; // Import useState, useEffect, and useTransition
import Link from 'next/link';
import Image from 'next/image';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, Heart, Star } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardFooter } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { getCart, clearCart } from '../../actions/cart';
import { CouponInputForm } from '../../components/cart/CouponInputForm';
import { CartItem } from '../../components/cart/CartItem';
import { useRouter } from 'next/navigation'; // For client-side redirect
import { toast } from 'sonner'; // Use sonner instead of react-hot-toast

const recommendedProducts = [
  {
    id: 4,
    name: "Leather Gloves",
    price: 39.99,
    image: "/images/products/gloves.jpg",
    rating: 4.7,
    reviews: 62,
    vendor: "Velvet Vault",
    slug: "leather-gloves"
  },
  {
    id: 5,
    name: "Wool Fedora Hat",
    price: 45.99,
    image: "/images/products/hat.jpg",
    rating: 4.6,
    reviews: 41,
    vendor: "Emporium Elegance",
    slug: "wool-fedora-hat"
  },
  {
    id: 6,
    name: "Winter Boots",
    price: 129.99,
    image: "/images/products/boots.jpg",
    rating: 4.8,
    reviews: 108,
    vendor: "Urban Threads",
    slug: "winter-boots"
  },
  {
    id: 7,
    name: "Designer Sunglasses",
    price: 149.99,
    image: "/images/products/sunglasses.jpg",
    rating: 4.7,
    reviews: 53,
    vendor: "Emporium Elegance",
    slug: "designer-sunglasses"
  }
];

// Define type for cart items fetched from getCart
// (Adjust based on the actual structure returned by getCart)
// This type should now match the prop type expected by CartItem
type CartItemType = {
  id: string; // CartItem ID
  quantity: number;
  productId: string;
  name: string;
  slug: string;
  price: number;
  inventory: number;
  image: string | null;
  imageAlt?: string | null;
  vendorId: string;
  vendorName: string | null;
};

export default function CartPage() {
  const router = useRouter();

  // State for cart items, loading status, and error
  const [cartItems, setCartItems] = useState<CartItemType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for applied discount
  const [appliedDiscount, setAppliedDiscount] = useState<number>(0);
  const [appliedCouponCode, setAppliedCouponCode] = useState<string | null>(null);

  // Add handler for Clear All button
  const [isClearing, startClearTransition] = useTransition();

  // --- Create a reusable function to fetch cart data ---
  const fetchCart = useCallback(async (isInitialLoad = false) => {
    if (!isInitialLoad) {
        // Optionally show a subtle loading state during updates?
    } else {
        setIsLoading(true); // Only set full loading on initial load
    }
    setError(null);
    try {
      const cartData = await getCart();
      if (cartData.success && cartData.cart?.items) {
        setCartItems(cartData.cart.items as CartItemType[]); 
        // Check for empty cart only on initial load maybe?
        if (isInitialLoad && cartData.cart.items.length === 0) {
           toast.info("Your cart is empty.");
           router.push('/'); // Go to homepage instead of login
           return;
        }
      } else {
        setError(cartData.message || "Failed to load cart items.");
        setCartItems([]);
        if (cartData.message === "User not authenticated.") {
            router.push('/login?callbackUrl=/cart');
            return;
        }
      }
    } catch (err: any) {
      console.error("Error fetching cart:", err);
      setError(err.message || "An unexpected error occurred while fetching the cart.");
      setCartItems([]);
    } finally {
       if (isInitialLoad) {
            setIsLoading(false); // Turn off initial loading state
       }
    }
  }, [router]); // Add dependencies for useCallback

  // --- useEffect for initial fetch ---
  useEffect(() => {
    fetchCart(true); // Pass true for initial load
  }, [fetchCart]); // Depend on fetchCart

  // Calculate totals based on state
  const subtotal = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  const itemCount = cartItems.reduce((count, item) => count + item.quantity, 0);
  
  // TODO: Implement real tax calculation
  const taxes = 0.00;
  const pickupFee = 0.00;
  // Use the state for the discount
  // Ensure calculations result in a number and handle potential NaN
  const calculatedTotal = (subtotal || 0) + (taxes || 0) + (pickupFee || 0) - (appliedDiscount || 0);
  const total = Math.max(0, isNaN(calculatedTotal) ? 0 : calculatedTotal); // Ensure total isn't negative or NaN

  // Handler for the CouponInputForm callback
  const handleCouponApply = (discount: number, couponCode: string | null) => {
    setAppliedDiscount(discount);
    setAppliedCouponCode(couponCode);
  };

  // Loading state return
  if (isLoading) {
    return (
      <div className="bg-zervia-50 py-8 min-h-screen flex items-center justify-center">
        <div className="container mx-auto px-4 text-center">
          <p>Loading your cart...</p>
          {/* Add Spinner component here if desired */}
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-zervia-50 py-8 min-h-screen">
      <div className="container mx-auto px-4">
        <h1 className="text-2xl md:text-3xl font-bold text-zervia-900 mb-8">Shopping Cart</h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
            <strong className="font-bold">Error:</strong>
            <span className="block sm:inline"> {error}</span>
          </div>
        )}
        
        {/* Conditional rendering for cart content vs empty state */} 
        {cartItems.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items List */}
            <div className="lg:col-span-2">
                <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
                    <div className="p-6 border-b border-gray-200">
                        <div className="flex justify-between items-center">
                            <h2 className="text-lg font-semibold text-zervia-900">
                            Cart Items ({itemCount})
                            </h2>
                            {/* Clear All Button - Updated */}
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-zervia-600 hover:text-red-600 disabled:opacity-50"
                              onClick={() => startClearTransition(async () => {
                                  const result = await clearCart();
                                  if (result?.error) {
                                      toast.error(result.error);
                                  } else {
                                      toast.success("Cart cleared.");
                                      fetchCart(); // Refetch after clearing
                                  }
                              })}
                              disabled={isClearing || cartItems.length === 0}
                            >
                              {isClearing ? "Clearing..." : "Clear All"}
                            </Button>
                        </div>
                    </div>
                    <div className="divide-y divide-gray-200">
                    {cartItems.map((item) => (
                        <CartItem key={item.id} item={item} onUpdate={fetchCart} />
                    ))}
                    </div>
                </div>
            </div>

            {/* Cart Summary */} 
            <div className="lg:col-span-1">
              <Card className="sticky top-24 shadow-sm">
                 <CardContent className="p-6 space-y-4">
                   <h2 className="text-lg font-semibold text-zervia-900">Order Summary</h2>
                   <div className="space-y-2">
                     {/* Subtotal, Taxes, Fee */}
                     <div className="flex justify-between text-zervia-700">
                       <span>Subtotal ({itemCount} {itemCount === 1 ? 'item' : 'items'})</span>
                       <span>${Number(subtotal).toFixed(2)}</span> 
                     </div>
                     <div className="flex justify-between text-zervia-700">
                       <span>Taxes</span>
                       <span>{taxes === 0 ? 'Calculated at checkout' : `$${Number(taxes).toFixed(2)}`}</span>
                     </div>
                     <div className="flex justify-between text-zervia-700">
                       <span>Campus Pickup Fee</span>
                       <span>{pickupFee === 0 ? 'Free' : `$${Number(pickupFee).toFixed(2)}`}</span>
                     </div>
                     {/* Applied Discount */}
                     {appliedDiscount > 0 && (
                       <div className="flex justify-between text-zervia-600 font-medium bg-green-50 p-2 rounded">
                         {/* Display code if available (handleCouponApply might need adjustment if needed) */}
                         <span>Discount {appliedCouponCode ? `(${appliedCouponCode})` : ''}</span>
                         <span className="text-green-700">-${Number(appliedDiscount).toFixed(2)}</span>
                       </div>
                     )}
                   </div>
                   {/* Coupon Form */}
                   <CouponInputForm 
                     cartSubtotal={subtotal} 
                     onCouponApply={handleCouponApply} 
                   />
                   {/* Estimated Total */}
                   <div className="border-t border-gray-200 pt-4 flex justify-between font-bold text-zervia-900 text-lg">
                     <span>Estimated Total</span>
                     <span>${Number(total).toFixed(2)}</span> 
                   </div>
                 </CardContent>
                 <CardFooter className="p-6 border-t border-gray-100">
                   <Button asChild size="lg" className="w-full">
                     <Link href="/checkout">
                       Proceed to Checkout <ArrowRight className="ml-2 h-4 w-4" />
                     </Link>
                   </Button>
                 </CardFooter>
              </Card>
            </div>
          </div> // End of grid for cart content
        ) : (
          // Empty Cart State
          <div className="text-center bg-white p-12 rounded-xl shadow-sm">
            <ShoppingBag className="mx-auto h-16 w-16 text-zervia-300" />
            <h2 className="mt-6 text-xl font-semibold text-zervia-900">Your cart is empty</h2>
            <p className="mt-2 text-zervia-600">Looks like you haven't added anything to your cart yet.</p>
            <Button asChild className="mt-6">
              <Link href="/">Start Shopping</Link>
            </Button>
          </div>
        )} {/* End of conditional rendering */} 

         {/* Recommended Products Section */} 
         <div className="mt-16">
            <h2 className="text-xl font-bold text-zervia-900 mb-6">You Might Also Like</h2>
             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                {recommendedProducts.map((recProduct) => (
                    <div key={recProduct.id} className="group">
                      {/* ... (Recommend product card content - no Add to Cart needed here) ... */}
                       <Link href={`/product/${recProduct.slug}`}>
                         <div className="relative h-56 rounded-lg overflow-hidden bg-zervia-50 mb-4">
                           <Image
                             src={recProduct.image || '/placeholder-product.jpg'}
                             alt={recProduct.name}
                             fill
                             className="object-cover transition-transform group-hover:scale-105"
                           />
                         </div>
                       </Link>
                       <Link href={`/product/${recProduct.slug}`} className="group">
                         <h3 className="font-medium text-sm text-zervia-900 group-hover:text-zervia-600 transition-colors truncate">
                           {recProduct.name}
                         </h3>
                       </Link>
                       <div className="flex items-center mt-1">
                         <div className="flex">
                           {[...Array(5)].map((_, i) => (
                             <Star 
                               key={i}
                               size={12}
                               className={i < Math.floor(recProduct.rating) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}
                             />
                           ))}
                         </div>
                         <span className="ml-1 text-xs text-zervia-500">({recProduct.reviews})</span>
                       </div>
                       <div className="mt-2 font-medium text-sm text-zervia-900">
                          <span>${recProduct.price.toFixed(2)}</span>
                       </div>
                    </div>
                ))}
             </div>
          </div> {/* End of Recommended Products */} 
      </div> {/* End of container */}
    </div> // End of main div
  );
} 