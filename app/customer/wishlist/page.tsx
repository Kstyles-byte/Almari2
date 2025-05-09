import { Card, CardContent } from '@/components/ui/card';
import { Heart, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export const metadata = {
  title: 'My Wishlist | Zervia',
  description: 'View and manage your wishlist',
};

export default async function CustomerWishlistPage() {
  // For now, return an empty wishlist since it's not implemented yet
  const wishlistItems: any[] = [];
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-zervia-900">My Wishlist</h1>
      
      {wishlistItems.length === 0 ? (
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Wishlist items will be displayed here when implemented */}
        </div>
      )}
    </div>
  );
} 