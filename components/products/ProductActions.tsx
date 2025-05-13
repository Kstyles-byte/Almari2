"use client";

import React, { useState, useEffect } from 'react';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { ShoppingCart } from 'lucide-react';
import { addToCart } from '../../actions/cart'; // Assuming addToCart is correctly set up
import { toast } from 'sonner'; // Assuming sonner for notifications

interface ProductActionsProps {
  productId: string;
  productName: string;
  inventory: number;
}

// Define the expected state shape returned by the action
interface AddToCartState {
  error?: string;
  success?: boolean;
}

// The initial state for useFormState
const initialState: AddToCartState = {
  error: undefined,
  success: false,
};

// Wrapper function to match useFormState signature
async function addToCartActionWrapper(
  prevState: AddToCartState, // This will be ignored by our original action
  formData: FormData
): Promise<AddToCartState> {
  // Call the original server action
  const result = await addToCart(formData);
  return result; // Return the result which should match AddToCartState
}

export function ProductActions({ productId, productName, inventory }: ProductActionsProps) {
  const [quantity, setQuantity] = useState(1);
  // Use the wrapper function with useActionState
  const [state, formAction] = useActionState(addToCartActionWrapper, initialState);
  // const { pending } = useFormStatus(); // Remove this line, useFormStatus must be used INSIDE the form component

  useEffect(() => {
    if (state.error) {
      toast.error(state.error);
    }
    if (state.success) {
      toast.success(`${productName} added to cart!`);
      // Dispatch custom event to notify header about cart update
      window.dispatchEvent(new Event('cart-updated'));
      // Optionally reset quantity or form state here
      setQuantity(1); 
    }
    // Reset server state message after showing toast
    // Note: useFormState doesn't automatically reset, manual handling or key prop might be needed
    // For simplicity, we rely on the next submission overriding the state.
  }, [state, productName]);

  const handleQuantityChange = (change: number) => {
    setQuantity((prev) => {
      const newQuantity = prev + change;
      if (newQuantity < 1) return 1;
      if (inventory > 0 && newQuantity > inventory) return inventory; // Prevent exceeding stock
      if (inventory === 0) return 1; // Should be disabled, but safeguard
      return newQuantity;
    });
  };

  const AddToCartButton = () => {
    const { pending } = useFormStatus();
    return (
      <Button 
        type="submit" 
        size="lg" 
        className="flex-1" 
        disabled={pending || inventory <= 0} 
        aria-disabled={pending || inventory <= 0}
      >
        {pending ? (
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
    );
  };

  return (
    <form action={formAction} className="space-y-4">
       <input type="hidden" name="productId" value={productId} />
       {/* Quantity Selector */}
       <div className="flex items-center border border-gray-300 rounded-md w-32">
          <button
              type="button" // Important: Prevent form submission
              onClick={() => handleQuantityChange(-1)}
              className="w-10 h-10 flex items-center justify-center text-zervia-600 hover:bg-zervia-50 disabled:opacity-50"
              aria-label="Decrease quantity"
              disabled={quantity <= 1 || inventory <= 0}
          >
              -
          </button>
          {/* Hidden input for quantity to be submitted with the form */}
          <input type="hidden" name="quantity" value={quantity} />
          {/* Display input */}
          <input
              type="text"
              className="w-full h-10 text-center border-0 focus:outline-none focus:ring-0 bg-transparent"
              value={quantity}
              readOnly // Display only, actual value submitted via hidden input
              aria-label="Current quantity"
          />
           <button
              type="button" // Important: Prevent form submission
              onClick={() => handleQuantityChange(1)}
              className="w-10 h-10 flex items-center justify-center text-zervia-600 hover:bg-zervia-50 disabled:opacity-50"
              aria-label="Increase quantity"
              disabled={quantity >= inventory || inventory <= 0}
           >
              +
           </button>
       </div>

       {/* Add to Cart Button */}
       <AddToCartButton />

       {/* Optional: Display server error message directly (alternative to toast) */}
       {/* {state.error && <p className="text-sm text-red-500">{state.error}</p>} */}
    </form>
  );
} 