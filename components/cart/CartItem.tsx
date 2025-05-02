'use client';

import React, { useState, useTransition } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Trash2, Plus, Minus } from 'lucide-react';
import { Button } from '../ui/button';
import { updateCartItem, removeFromCart } from '../../actions/cart'; // Import actions
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

// Define the type for a single cart item passed as a prop
// Matches the structure from getCart action after formatting
type CartItemProps = {
  item: {
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
  // Optional: Callback to notify parent page of changes if needed (e.g., recalculate total instantly)
  onUpdate?: () => void; 
};

export function CartItem({ item, onUpdate }: CartItemProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter(); // For refreshing data after action

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity < 1 || newQuantity > item.inventory) {
      toast.warning(`Cannot set quantity to ${newQuantity}. Available: ${item.inventory}.`);
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.append('cartItemId', item.id);
      formData.append('quantity', newQuantity.toString());
      
      const result = await updateCartItem(formData);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success('Quantity updated.');
        // Re-fetch or update state on parent page
        router.refresh(); // Simple refresh to refetch cart data
        onUpdate?.(); // Call callback if provided
      }
    });
  };

  const handleRemoveItem = () => {
    startTransition(async () => {
        const formData = new FormData();
        formData.append('cartItemId', item.id);

        // Pass null as prevState if your action doesn't use it
        const result = await removeFromCart(null, formData); 
        if (result?.error) {
            toast.error(result.error);
        } else {
            toast.success('Item removed from cart.');
             // Re-fetch or update state on parent page
            router.refresh(); // Simple refresh to refetch cart data
            onUpdate?.(); // Call callback if provided
        }
    });
  };

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col sm:flex-row">
        {/* Image */}
        <div className="sm:w-24 sm:h-24 h-32 w-full relative mb-4 sm:mb-0 sm:mr-6 flex-shrink-0">
          <Image
            src={item.image || '/placeholder-product.jpg'}
            alt={item.name}
            fill
            className="object-cover rounded-md"
            onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder-product.jpg'; }}
          />
        </div>

        {/* Details & Price */}
        <div className="flex-1">
          <div className="flex flex-col sm:flex-row sm:justify-between">
            <div>
              <Link 
                href={`/product/${item.slug}`}
                className="font-medium text-zervia-900 hover:text-zervia-600 line-clamp-2"
              >
                {item.name}
              </Link>
              <p className="text-sm text-zervia-500 mt-1">
                Vendor: {item.vendorName || 'N/A'}
              </p>
              {/* TODO: Add variant info if applicable */}
            </div>
            <div className="mt-2 sm:mt-0 sm:text-right">
              <div className="font-medium text-zervia-900">
                ${item.price.toFixed(2)}
              </div>
              {item.quantity > 1 && (
                <div className="text-xs text-zervia-500 mt-1">
                  (${item.price.toFixed(2)} each)
                </div>
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
            {/* Quantity Control */}
            <div className="flex items-center border border-gray-300 rounded-md">
              <button
                className="w-8 h-8 flex items-center justify-center text-zervia-600 hover:bg-zervia-50 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={item.quantity <= 1 || isPending}
                onClick={() => handleQuantityChange(item.quantity - 1)}
                aria-label="Decrease quantity"
              >
                <Minus size={16} />
              </button>
              <span
                className="w-10 h-8 text-center flex items-center justify-center text-sm"
                aria-live="polite" // Announce changes to screen readers
                aria-label={`Current quantity: ${item.quantity}`}
              >
                {item.quantity}
              </span>
              <button
                className="w-8 h-8 flex items-center justify-center text-zervia-600 hover:bg-zervia-50 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={item.quantity >= item.inventory || isPending}
                onClick={() => handleQuantityChange(item.quantity + 1)}
                aria-label="Increase quantity"
              >
                <Plus size={16} />
              </button>
            </div>

            {/* Remove Button */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-red-600 hover:bg-red-50 h-8 w-8"
              onClick={handleRemoveItem}
              disabled={isPending}
              aria-label={`Remove ${item.name} from cart`}
            >
              {isPending ? (
                <span className="animate-spin h-4 w-4">...</span>
              ) : (
                <Trash2 size={16} />
              )}
            </Button>
          </div>
           {/* Display inventory warning if low */}
           {item.inventory > 0 && item.inventory <= 5 && (
               <p className="text-xs text-orange-600 mt-2">Only {item.inventory} left in stock!</p>
           )}
            {item.quantity > item.inventory && item.inventory > 0 && (
                <p className="text-xs text-red-600 mt-2">Quantity exceeds stock ({item.inventory}). Please reduce.</p>
            )}
        </div>
      </div>
    </div>
  );
}
