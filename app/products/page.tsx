import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Filter, Grid2X2, List, ArrowDown, ArrowUp, Star, Heart, ShoppingCart } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { EmptyState } from '../../components/ui/empty-state';
import { RecentlyViewedProducts } from '../../components/products/recently-viewed-products';
import { getProducts } from '@/actions/products';
import { ProductGrid } from '../../components/products/product-grid';
import { getCategoryBySlug } from '@/actions/content';

interface ProductListingItem {
  id: string;
  name: string;
  slug: string;
  price: number;
  comparePrice: number | null;
  image: string;
  rating: number;
  reviews: number;
  isNew: boolean;
  vendor: string;
  category: string;
}

interface ProductListingPageProps {
  searchParams: { 
    category?: string; 
    sort?: string; 
    page?: string; 
    view?: 'grid' | 'list';
    q?: string; 
  };
}

const Placeholder = ({ name }: { name: string }) => (
  <div className="p-4 border rounded bg-gray-100 text-gray-500 text-sm">
    Placeholder for {name}
  </div>
);

export default async function ProductListingPage({ searchParams }: ProductListingPageProps) {
  const currentPage = parseInt(searchParams.page || '1', 10);
  const currentSort = searchParams.sort || 'featured';
  const currentQuery = searchParams.q || '';
  const categorySlug = searchParams.category;
  const itemsPerPage = 12;

  const categoryDetails = categorySlug ? await getCategoryBySlug(categorySlug) : null;

  const { products, count, totalPages } = await getProducts({
    categorySlug: categorySlug,
    query: currentQuery,
    sortBy: currentSort,
    page: currentPage,
    limit: itemsPerPage,
  });

  return (
    <div className="bg-zervia-50 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 h-6"></div>

        <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-zervia-900 mb-1">
              {categoryDetails ? categoryDetails.name : 'All Products'}
            </h1>
            <p className="text-zervia-600">
              Showing {products.length} of {count} {count === 1 ? 'product' : 'products'} {currentQuery ? `for "${currentQuery}"` : ''}
            </p>
          </div>
          <Placeholder name="Mobile Filters Trigger" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="hidden lg:block lg:col-span-1">
            <Placeholder name="Product Filters" />
          </div>

          <div className="lg:col-span-3">
            <div className="flex items-center justify-between mb-6 p-4 bg-white rounded-lg shadow-sm">
              <Placeholder name="Sort Controls" />
              <Placeholder name="View Toggle" />
            </div>

            {products.length > 0 ? (
              <>
                <ProductGrid products={products as ProductListingItem[]} />
                
                {totalPages > 1 && (
                  <div className="mt-8">
                    <Placeholder name={`Pagination (Page ${currentPage}/${totalPages})`} />
                  </div>
                )}
              </>
            ) : (
              <EmptyState 
                title="No Products Found"
                description={currentQuery 
                  ? `We couldn\'t find any products matching "${currentQuery}". Try adjusting your search or filters.`
                  : "Try adjusting your filters or check back later."
                }
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 