"use client";

import React, { useState, useTransition } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { ShoppingCart } from 'lucide-react';
import { addToCart } from '../../actions/cart-client'; // Import client-side action
import { toast } from 'sonner'; 

interface ProductActionsProps {
  productId: string;
  productName: string;
  inventory: number;
  price: number; // Add price prop
  image?: string; // Add image prop
  vendorName?: string; // Add vendorName prop
}

export function ProductActions({ 
  productId, 
  productName, 
  inventory, 
  price, 
  image, 
  vendorName 
}: ProductActionsProps) {
  const [quantity, setQuantity] = useState(1);
  const [isPending, startTransition] = useTransition();

  const handleQuantityChange = (change: number) => {
    setQuantity((prev) => {
      const newQuantity = prev + change;
      if (newQuantity < 1) return 1;
      if (inventory > 0 && newQuantity > inventory) return inventory; // Prevent exceeding stock
      if (inventory === 0) return 1; // Should be disabled, but safeguard
      return newQuantity;
    });
  };

  const handleAddToCart = () => {
    startTransition(async () => {
      try {
        const result = await addToCart({ 
          id: productId,
          name: productName,
          price: price,
          image: image,
          vendorName: vendorName
        }, quantity);

        if (result?.error) {
          toast.error(result.error);
        } else if (result?.success) {
          toast.success(`${productName} added to cart!`);
          // Dispatch custom event to notify header about cart update
          window.dispatchEvent(new Event('cart-updated'));
          // Reset quantity after adding to cart
          setQuantity(1); 
        }
      } catch (error) {
        console.error("Failed to add to cart:", error);
        toast.error("Could not add item to cart.");
      }
    });
  };

  return (
    <div className="space-y-4">
       {/* Quantity Selector */}
       <div className="flex items-center border border-gray-300 rounded-md w-32">
          <button
              type="button" 
              onClick={() => handleQuantityChange(-1)}
              className="w-10 h-10 flex items-center justify-center text-zervia-600 hover:bg-zervia-50 disabled:opacity-50"
              aria-label="Decrease quantity"
              disabled={quantity <= 1 || inventory <= 0 || isPending}
          >
              -
          </button>
          <input
              type="text"
              className="w-full h-10 text-center border-0 focus:outline-none focus:ring-0 bg-transparent"
              value={quantity}
              readOnly 
              aria-label="Current quantity"
          />
           <button
              type="button" 
              onClick={() => handleQuantityChange(1)}
              className="w-10 h-10 flex items-center justify-center text-zervia-600 hover:bg-zervia-50 disabled:opacity-50"
              aria-label="Increase quantity"
              disabled={quantity >= inventory || inventory <= 0 || isPending}
           >
              +
           </button>
       </div>

       {/* Add to Cart Button */}
       <Button 
        onClick={handleAddToCart} 
        size="lg" 
        className="flex-1 w-full" // Make button full width
        disabled={isPending || inventory <= 0} 
        aria-disabled={isPending || inventory <= 0}
      >
        {isPending ? (
          <>
            <span className="animate-spin mr-2">...</span> Adding...
          </>
        ) : inventory > 0 ? (
          <>
            <ShoppingCart className="mr-2 h-5 w-5" /> Add to Cart
          </>
        ) : (
          'Out of Stock'
        )}
      </Button>
    </div>
  );
} 