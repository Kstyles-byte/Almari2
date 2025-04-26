import React from 'react';
import Link from 'next/link';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

// Mock cart data
const cartItems = [
  {
    id: 1,
    name: "Premium Wool Blend Oversized Coat",
    price: 149.99,
    quantity: 1
  },
  {
    id: 2,
    name: "Leather Crossbody Bag",
    price: 89.99,
    quantity: 1
  },
  {
    id: 3,
    name: "Cashmere Blend Scarf",
    price: 49.99,
    quantity: 2
  }
];

export const CartSummary = () => {
  // Calculate totals
  const subtotal = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  const itemCount = cartItems.reduce((count, item) => count + item.quantity, 0);
  
  return (
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
  );
};

export default CartSummary; 