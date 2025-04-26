import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, Heart } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardFooter } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import CartItems from '../../components/cart/CartItems';
import CartSummary from '../../components/cart/CartSummary';
import EmptyCart from '../../components/cart/EmptyCart';

export const metadata = {
  title: 'Your Cart | Zervia - Multi-vendor E-commerce Platform',
  description: 'View and manage items in your shopping cart.',
};

// Mock cart data
const cartItems = [
  {
    id: 1,
    name: "Premium Wool Blend Oversized Coat",
    price: 149.99,
    quantity: 1,
    image: "/images/products/coat-1.jpg",
    color: "Black",
    size: "M",
    vendor: "Emporium Elegance",
    slug: "premium-wool-blend-oversized-coat",
    inStock: true
  },
  {
    id: 2,
    name: "Leather Crossbody Bag",
    price: 89.99,
    quantity: 1,
    image: "/images/products/bag.jpg",
    color: "Brown",
    size: "One Size",
    vendor: "Velvet Vault",
    slug: "leather-crossbody-bag",
    inStock: true
  },
  {
    id: 3,
    name: "Cashmere Blend Scarf",
    price: 49.99,
    quantity: 2,
    image: "/images/products/scarf.jpg",
    color: "Grey",
    size: "One Size",
    vendor: "Emporium Elegance",
    slug: "cashmere-blend-scarf",
    inStock: true
  }
];

// Mock recommended products
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

export default function CartPage() {
  // Calculate totals
  const subtotal = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  const itemCount = cartItems.reduce((count, item) => count + item.quantity, 0);
  
  return (
    <div className="bg-zervia-50 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-2xl md:text-3xl font-bold text-zervia-900 mb-8">Shopping Cart</h1>
        
        {cartItems.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-zervia-900">
                      Cart Items ({itemCount})
                    </h2>
                    <Button variant="ghost" size="sm" className="text-zervia-600">
                      Clear All
                    </Button>
                  </div>
                </div>
                
                <div className="divide-y divide-gray-200">
                  {cartItems.map((item) => (
                    <div key={item.id} className="p-6">
                      <div className="flex flex-col sm:flex-row">
                        <div className="sm:w-24 sm:h-24 h-32 w-full relative mb-4 sm:mb-0 sm:mr-6">
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            className="object-cover rounded-md"
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex flex-col sm:flex-row sm:justify-between">
                            <div>
                              <Link 
                                href={`/product/${item.slug}`}
                                className="font-medium text-zervia-900 hover:text-zervia-600"
                              >
                                {item.name}
                              </Link>
                              <p className="text-sm text-zervia-500 mt-1">
                                Vendor: {item.vendor}
                              </p>
                              <div className="text-sm text-zervia-600 mt-1">
                                <span>{item.color}</span>
                                {item.size !== "One Size" && (
                                  <>
                                    <span className="mx-2">•</span>
                                    <span>Size: {item.size}</span>
                                  </>
                                )}
                              </div>
                            </div>
                            <div className="mt-4 sm:mt-0 text-right">
                              <div className="font-medium text-zervia-900">
                                ${item.price.toFixed(2)}
                              </div>
                              {item.quantity > 1 && (
                                <div className="text-xs text-zervia-500 mt-1">
                                  ${item.price.toFixed(2)} each
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                            <div className="flex items-center space-x-4">
                              <div className="flex items-center border border-gray-300 rounded-md">
                                <button
                                  className="w-8 h-8 flex items-center justify-center text-zervia-600 hover:bg-zervia-50"
                                  disabled={item.quantity <= 1}
                                  aria-label="Decrease quantity"
                                >
                                  <Minus size={16} />
                                </button>
                                <div className="w-10 text-center">
                                  <input
                                    type="text"
                                    className="w-full h-8 text-center border-0 focus:outline-none focus:ring-0"
                                    value={item.quantity}
                                    readOnly
                                  />
                                </div>
                                <button
                                  className="w-8 h-8 flex items-center justify-center text-zervia-600 hover:bg-zervia-50"
                                  aria-label="Increase quantity"
                                >
                                  <Plus size={16} />
                                </button>
                              </div>
                              
                              <button className="text-zervia-600 hover:text-zervia-800 flex items-center">
                                <Heart size={16} className="mr-1" />
                                <span className="text-sm">Save</span>
                              </button>
                            </div>
                            
                            <button className="text-red-500 hover:text-red-700 flex items-center">
                              <Trash2 size={16} className="mr-1" />
                              <span className="text-sm">Remove</span>
                            </button>
                          </div>
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
                <div className="text-sm text-zervia-600">
                  Items are reserved for 60 minutes
                </div>
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
                      <span className="font-medium text-zervia-900">$0.00</span>
                    </div>
                    
                    {/* Coupon Code */}
                    <div className="pt-4 border-t border-gray-200">
                      <label className="block text-sm font-medium text-zervia-700 mb-2">
                        Apply Coupon Code
                      </label>
                      <div className="flex space-x-2">
                        <Input 
                          placeholder="Enter code" 
                          className="flex-1"
                        />
                        <Button variant="outline">Apply</Button>
                      </div>
                    </div>
                    
                    {/* Total */}
                    <div className="pt-4 border-t border-gray-200">
                      <div className="flex justify-between">
                        <span className="font-medium text-zervia-900">Total</span>
                        <span className="font-bold text-xl text-zervia-900">${subtotal.toFixed(2)}</span>
                      </div>
                      <p className="text-xs text-zervia-500 mt-1">Including all taxes</p>
                    </div>
                    
                    <Button size="lg" className="w-full mt-4" asChild>
                      <Link href="/checkout">
                        Proceed to Checkout
                      </Link>
                    </Button>
                    
                    <div className="text-center text-sm text-zervia-600 mt-4">
                      <p>Free pickup at any campus location</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
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
        
        {/* Recommended Products */}
        <div className="mt-16">
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
                      />
                    </div>
                  </Link>
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
                    <h3 className="font-medium text-zervia-900 group-hover:text-zervia-600 transition-colors">
                      {product.name}
                    </h3>
                  </Link>
                  <p className="text-sm text-zervia-500 mt-1">{product.vendor}</p>
                  <div className="mt-2 font-medium text-zervia-900">${product.price.toFixed(2)}</div>
                </CardContent>
                <CardFooter className="pt-0">
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