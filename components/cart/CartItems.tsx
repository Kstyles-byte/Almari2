import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Trash2, Plus, Minus, Heart } from 'lucide-react';
import { Button } from '../ui/button';

// Mock cart data (same as in the cart page)
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

export const CartItems = () => {
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-zervia-900">
            Cart Items ({cartItems.reduce((count, item) => count + item.quantity, 0)})
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
  );
};

export default CartItems;