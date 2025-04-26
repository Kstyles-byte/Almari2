'use client';

import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { WishlistItem } from "@/components/customer/wishlist-item";
import { Heart, ShoppingCart } from 'lucide-react';
import Link from 'next/link';

// Mock wishlist data
const mockWishlistData = [
  {
    id: "1",
    name: "Premium Cotton T-Shirt",
    slug: "premium-cotton-tshirt",
    price: 29.99,
    image: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=300&h=300&fit=crop",
    vendor: "Fashion Emporium",
    rating: 4.5,
    reviews: 128,
    inStock: true,
    dateAdded: "2023-04-15T10:30:00Z"
  },
  {
    id: "2",
    name: "Classic Denim Jacket",
    slug: "classic-denim-jacket",
    price: 89.99,
    image: "https://images.unsplash.com/photo-1598554747436-c9293d6a588f?w=300&h=300&fit=crop",
    vendor: "Urban Threads",
    rating: 4.8,
    reviews: 75,
    inStock: true,
    dateAdded: "2023-04-10T14:45:00Z"
  },
  {
    id: "3",
    name: "Vintage Leather Backpack",
    slug: "vintage-leather-backpack",
    price: 120.00,
    image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=300&h=300&fit=crop",
    vendor: "Accessories Co.",
    rating: 4.7,
    reviews: 62,
    inStock: false,
    dateAdded: "2023-04-05T09:15:00Z"
  },
  {
    id: "4",
    name: "Slim Fit Chino Pants",
    slug: "slim-fit-chino-pants",
    price: 45.99,
    image: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=300&h=300&fit=crop",
    vendor: "Fashion Emporium",
    rating: 4.3,
    reviews: 54,
    inStock: true,
    dateAdded: "2023-04-02T11:20:00Z"
  }
];

export default function WishlistPage() {
  const [wishlistItems, setWishlistItems] = useState(mockWishlistData);
  const [addToCartMessage, setAddToCartMessage] = useState<string | null>(null);

  const handleRemoveFromWishlist = (productId: string) => {
    setWishlistItems(prev => prev.filter(item => item.id !== productId));
  };

  const handleAddToCart = (productId: string) => {
    // In a real application, you would make an API call to add the item to the cart
    const product = wishlistItems.find(item => item.id === productId);
    if (product) {
      setAddToCartMessage(`${product.name} added to cart successfully!`);
      setTimeout(() => setAddToCartMessage(null), 3000);
    }
  };

  const handleClearWishlist = () => {
    setWishlistItems([]);
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">My Wishlist</h1>
          <p className="text-zervia-500">{wishlistItems.length} {wishlistItems.length === 1 ? 'item' : 'items'}</p>
        </div>

        {wishlistItems.length > 0 && (
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              className="text-zervia-600 border-zervia-200"
              onClick={handleClearWishlist}
            >
              Clear All
            </Button>
            <Button className="bg-zervia-600 hover:bg-zervia-700">
              <ShoppingCart className="h-4 w-4 mr-2" /> Add All to Cart
            </Button>
          </div>
        )}
      </div>

      {/* Success message */}
      {addToCartMessage && (
        <div className="bg-green-100 text-green-800 p-3 rounded-md mb-4">
          {addToCartMessage}
        </div>
      )}

      {wishlistItems.length > 0 ? (
        <div className="space-y-4">
          {wishlistItems.map(item => (
            <WishlistItem 
              key={item.id} 
              product={item} 
              onRemove={handleRemoveFromWishlist}
              onAddToCart={handleAddToCart}
            />
          ))}
        </div>
      ) : (
        <Card className="p-6">
          <EmptyState
            icon={<Heart className="h-12 w-12 text-zervia-300" />}
            title="Your wishlist is empty"
            description="Items added to your wishlist will appear here. Find something you like?"
            action={
              <Link href="/products">
                <Button className="bg-zervia-600 hover:bg-zervia-700">
                  Continue Shopping
                </Button>
              </Link>
            }
          />
        </Card>
      )}
    </div>
  );
} 