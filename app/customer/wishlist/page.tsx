import { Card, CardContent } from '@/components/ui/card';
import { Heart, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { getWishlistItems } from '@/actions/wishlist';
import { WishlistItem } from '@/components/customer/wishlist-item';
import { addToCart } from '@/actions/cart';
import { removeFromWishlist } from '@/actions/wishlist';

export const metadata = {
  title: 'My Wishlist | Zervia',
  description: 'View and manage your wishlist',
};

// Server actions for the client components to use
async function handleRemoveFromWishlist(id: string) {
  'use server';
  const formData = new FormData();
  formData.append('wishlistItemId', id);
  await removeFromWishlist(formData);
}

async function handleAddToCart(id: string) {
  'use server';
  const formData = new FormData();
  formData.append('productId', id);
  formData.append('quantity', '1');
  await addToCart(formData);
}

export default async function CustomerWishlistPage() {
  // Fetch actual wishlist items
  const { items, error } = await getWishlistItems();
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-zervia-900">My Wishlist</h1>
      
      {items.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <Heart className="h-12 w-12 mx-auto text-zervia-200 mb-3" />
            <p className="text-zervia-500">Your wishlist is empty</p>
            <p className="text-sm text-zervia-400 mt-1">
              Save items you're interested in by clicking the heart icon on product pages
            </p>
            <Link href="/products" className="mt-4 inline-block">
              <Button>
                <ShoppingBag className="h-4 w-4 mr-2" />
                Browse Products
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <WishlistItem 
              key={item.id}
              product={item.product}
              onRemove={handleRemoveFromWishlist}
              onAddToCart={handleAddToCart}
            />
          ))}
        </div>
      )}
    </div>
  );
} 