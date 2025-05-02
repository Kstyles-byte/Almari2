'use client'; // Make CartPage a client component to use state

import React, { useState, useEffect } from 'react'; // Import useState and useEffect
import Link from 'next/link';
import Image from 'next/image';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, Heart } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardFooter } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { getCart } from '../../actions/cart';
import { CouponInputForm } from '../../components/cart/CouponInputForm'; // Import the new component
import { useSession } from 'next-auth/react'; // Use useSession for client-side auth check
import { useRouter } from 'next/navigation'; // For client-side redirect

export const metadata = {
  title: 'Your Cart | Zervia - Multi-vendor E-commerce Platform',
  description: 'View and manage items in your shopping cart.',
};

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
type CartItemType = {
  id: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    inventory: number;
    image: string | null;
    vendor: string | null;
  };
};

export default function CartPage() {
  // Client-side session check
  const { data: session, status } = useSession();
  const router = useRouter();

  // State for cart items, loading status, and error
  const [cartItems, setCartItems] = useState<CartItemType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for applied discount
  const [appliedDiscount, setAppliedDiscount] = useState<number>(0);
  const [appliedCouponCode, setAppliedCouponCode] = useState<string | null>(null);

  // Fetch cart data on component mount
  useEffect(() => {
    // Redirect if not authenticated after check
    if (status === 'unauthenticated') {
        router.push('/login?callbackUrl=/cart');
        return; // Stop execution if redirecting
    }

    // Fetch cart only if authenticated
    if (status === 'authenticated') {
      const fetchCart = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const cartData = await getCart();
          if (cartData.success && cartData.cart?.items) {
            setCartItems(cartData.cart.items);
            // Reset discount if cart changes (optional, depends on desired behavior)
            setAppliedDiscount(0);
            setAppliedCouponCode(null);
          } else {
            setError(cartData.message || "Failed to load cart items.");
            setCartItems([]); // Ensure cart is empty on error
          }
        } catch (err: any) {
          console.error("Error fetching cart:", err);
          setError(err.message || "An unexpected error occurred while fetching the cart.");
          setCartItems([]);
        } finally {
          setIsLoading(false);
        }
      };
      fetchCart();
    }

     // If status is 'loading', we wait for the session check to complete.

  }, [status, router]); // Depend on session status

  // Calculate totals based on state
  const subtotal = cartItems.reduce((total, item) => total + (item.product.price * item.quantity), 0);
  const itemCount = cartItems.reduce((count, item) => count + item.quantity, 0);
  
  // TODO: Implement real tax calculation
  const taxes = 0.00;
  const pickupFee = 0.00;
  // Use the state for the discount
  const total = Math.max(0, subtotal + taxes + pickupFee - appliedDiscount); // Ensure total isn't negative

  // Handler for the CouponInputForm callback
  const handleCouponApply = (discount: number, couponCode: string | null) => {
    setAppliedDiscount(discount);
    setAppliedCouponCode(couponCode);
  };

  // Handle loading and initial auth check state
  if (status === 'loading' || isLoading) {
    return (
      <div className="bg-zervia-50 py-8 min-h-screen flex items-center justify-center">
        <div className="container mx-auto px-4 text-center">
          <p>Loading your cart...</p>
           {/* TODO: Add a proper loader/spinner component */}
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
        
        {cartItems.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-zervia-900">
                      Cart Items ({itemCount})
                    </h2>
                     {/* TODO: Implement Clear All functionality - Requires action & state update */}
                    <Button variant="ghost" size="sm" className="text-zervia-600">
                      Clear All
                    </Button>
                  </div>
                </div>
                
                <div className="divide-y divide-gray-200">
                  {cartItems.map((item) => (
                    // Item rendering logic largely the same, but uses `item` from state
                    <div key={item.id} className="p-6">
                       <div className="flex flex-col sm:flex-row">
                         <div className="sm:w-24 sm:h-24 h-32 w-full relative mb-4 sm:mb-0 sm:mr-6 flex-shrink-0">
                           <Image
                             src={item.product.image || '/placeholder-product.jpg'}
                             alt={item.product.name}
                             fill
                             className="object-cover rounded-md"
                             onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder-product.jpg'; }}
                           />
                         </div>
                         <div className="flex-1">
                           <div className="flex flex-col sm:flex-row sm:justify-between">
                             <div>
                               <Link 
                                 href={`/product/${item.product.slug}`}
                                 className="font-medium text-zervia-900 hover:text-zervia-600 line-clamp-2"
                               >
                                 {item.product.name}
                               </Link>
                               <p className="text-sm text-zervia-500 mt-1">
                                 Vendor: {item.product.vendor || 'N/A'}
                               </p>
                               {/* Variant display placeholder */}
                             </div>
                             <div className="mt-4 sm:mt-0 text-right">
                               <div className="font-medium text-zervia-900">
                                 ${item.product.price.toFixed(2)}
                               </div>
                               {item.quantity > 1 && (
                                 <div className="text-xs text-zervia-500 mt-1">
                                   ${item.product.price.toFixed(2)} each
                                 </div>
                               )}
                             </div>
                           </div>
                           
                            {/* Item controls placeholders - Requires client logic */}
                           <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                             <div className="flex items-center space-x-4">
                               {/* Quantity Input - Placeholder */}
                               <div className="flex items-center border border-gray-300 rounded-md">
                                <button
                                   className="w-8 h-8 flex items-center justify-center text-zervia-600 hover:bg-zervia-50 disabled:opacity-50"
                                   disabled={item.quantity <= 1}
                                   aria-label="Decrease quantity"
                                   // onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                                 >
                                   <Minus size={16} />
                                 </button>
                                 <input
                                   type="text"
                                   className="w-10 h-8 text-center border-0 focus:outline-none focus:ring-0"
                                   value={item.quantity}
                                   readOnly
                                 />
                                 <button
                                   className="w-8 h-8 flex items-center justify-center text-zervia-600 hover:bg-zervia-50 disabled:opacity-50"
                                   aria-label="Increase quantity"
                                   // disabled={item.quantity >= item.product.inventory}
                                   // onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                                 >
                                   <Plus size={16} />
                                 </button>
                               </div>
                               
                                {/* Save for Later - Placeholder */}
                               <button className="text-zervia-600 hover:text-zervia-800 flex items-center">
                                 <Heart size={16} className="mr-1" />
                                 <span className="text-sm">Save</span>
                               </button>
                             </div>
                             
                              {/* Remove Item - Placeholder */}
                             <button 
                               className="text-red-500 hover:text-red-700 flex items-center"
                               // onClick={() => handleRemoveItem(item.id)}
                              >
                               <Trash2 size={16} className="mr-1" />
                               <span className="text-sm">Remove</span>
                             </button>
                           </div>
                            {item.product.inventory < item.quantity && (
                                 <p className="text-xs text-red-600 mt-2">Inventory issue: Only {item.product.inventory} available.</p>
                             )}
                         </div>
                       </div>
                     </div>
                  ))}
                </div>
              </div>
              
              {/* Continue Shopping */}
              <div className="flex justify-between items-center">
                <Button variant="outline" asChild>
                  <Link href="/products">
                    <ArrowRight className="mr-2 h-4 w-4 rotate-180" />
                    Continue Shopping
                  </Link>
                </Button>
              </div>
            </div>
            
            {/* Cart Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-sm overflow-hidden sticky top-6">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-zervia-900">Order Summary</h2>
                </div>
                
                <div className="p-6">
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-zervia-600">Subtotal ({itemCount} items)</span>
                      <span className="font-medium text-zervia-900">${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zervia-600">Pickup Fee</span>
                      <span className="font-medium text-zervia-900">${pickupFee.toFixed(2)}</span>
                    </div>
                    
                     {/* --- Coupon Section --- */}
                    <div className="pt-4 border-t border-gray-200">
                       {/* Use the CouponInputForm component */} 
                      <CouponInputForm 
                        cartSubtotal={subtotal} 
                        onCouponApply={handleCouponApply} 
                      />
                       {/* Display applied discount details */} 
                       {appliedDiscount > 0 && appliedCouponCode && (
                         <div className="flex justify-between mt-2 text-green-600">
                             <span>Discount ({appliedCouponCode})</span>
                             <span>-${appliedDiscount.toFixed(2)}</span>
                         </div>
                      )}
                    </div>
                    
                    {/* Total */}
                    <div className="pt-4 border-t border-gray-200">
                      <div className="flex justify-between">
                        <span className="font-medium text-zervia-900">Total</span>
                        {/* Use calculated total including discount */} 
                         <span className="font-bold text-xl text-zervia-900">${total.toFixed(2)}</span>
                      </div>
                      <p className="text-xs text-zervia-500 mt-1">Including all taxes</p>
                    </div>
                    
                    <Button 
                      size="lg" 
                      className="w-full mt-4" 
                      asChild 
                      disabled={cartItems.some(item => item.product.inventory < item.quantity)} // Disable if any item has inventory issue
                    >
                      <Link href="/checkout">
                        Proceed to Checkout
                      </Link>
                    </Button>
                    {cartItems.some(item => item.product.inventory < item.quantity) && (
                         <p className="text-xs text-red-600 text-center mt-2">Please resolve inventory issues before proceeding.</p>
                    )}
                    
                    <div className="text-center text-sm text-zervia-600 mt-4">
                      <p>Free pickup at any campus location</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
           // Empty Cart State 
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-zervia-100 text-zervia-600 mb-6">
                <ShoppingBag className="h-8 w-8" />
              </div>
              <h2 className="text-2xl font-bold text-zervia-900 mb-4">Your cart is empty</h2>
              <p className="text-zervia-600 mb-8">
                Looks like you haven't added any items to your cart yet. Continue shopping and discover amazing products!
              </p>
              <Button size="lg" asChild>
                <Link href="/products">
                  Continue Shopping
                </Link>
              </Button>
            </div>
          </div>
        )}
        
        {/* Recommended Products (kept mock data) */}
        <div className="mt-16">
           {/* Recommended product rendering */} 
           <h2 className="text-2xl font-bold text-zervia-900 mb-8">Recommended For You</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {recommendedProducts.map((product) => (
              <Card key={product.id} className="group">
                <div className="relative">
                  <Link href={`/product/${product.slug}`}>
                    <div className="relative h-60 w-full overflow-hidden">
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        className="object-cover transition-transform group-hover:scale-105"
                        onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder-product.jpg'; }}
                      />
                    </div>
                  </Link>
                  {/* Add to Wishlist - Placeholder */}
                  <Button
                    size="icon"
                    variant="outline"
                    className="absolute top-2 right-2 h-8 w-8 rounded-full bg-white opacity-90 hover:opacity-100"
                  >
                    <Heart className="h-4 w-4 text-zervia-600" />
                  </Button>
                </div>
                <CardContent className="pt-4">
                  <Link href={`/product/${product.slug}`} className="group">
                    <h3 className="font-medium text-zervia-900 group-hover:text-zervia-600 transition-colors truncate">
                      {product.name}
                    </h3>
                  </Link>
                  <p className="text-sm text-zervia-500 mt-1">{product.vendor}</p>
                  <div className="mt-2 font-medium text-zervia-900">${product.price.toFixed(2)}</div>
                </CardContent>
                <CardFooter className="pt-0">
                   {/* Add to Cart - Placeholder */}
                  <Button size="sm" className="w-full">
                    Add to Cart
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 