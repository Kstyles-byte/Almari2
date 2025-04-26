import React from 'react';
import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';
import { Button } from '../ui/button';

export const EmptyCart = () => {
  return (
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
  );
};

export default EmptyCart; 