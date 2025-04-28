import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Filter, Grid2X2, List, ArrowDown, ArrowUp, Star, Heart, ShoppingCart } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '../../components/ui/breadcrumb';
import { cn } from "../../lib/utils";
import { EmptyState } from '../../components/ui/empty-state';
import { ProductFilters } from '../../components/products/product-filters';
import { MobileFilters } from '../../components/products/mobile-filters';
import { PaginationControls } from '../../components/products/pagination-controls';
import { ProductSort } from '../../components/products/product-sort';
import { RecentlyViewedProducts } from '../../components/products/recently-viewed-products';
import { getProducts } from '@/actions/products';
import { ProductGrid } from '../../components/products/product-grid';
import { getCategoryBySlug, getRootCategories } from '@/actions/content';
import { getAllBrands } from '@/actions/brands';
import type { Category } from '../../types/supabase';

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
    [key: string]: string | string[] | undefined;
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

  const [categoryDetails, rootCategories, allBrands] = await Promise.all([
    categorySlug ? getCategoryBySlug(categorySlug) : Promise.resolve(null),
    getRootCategories(),
    getAllBrands()
  ]);

  const filterData = {
    categories: {
      id: 'category',
      name: 'Categories',
      options: rootCategories.map((cat: Category) => ({ id: cat.slug, label: cat.name }))
    },
    brands: {
      id: 'brand',
      name: 'Brands',
      options: allBrands.map((brand: string) => ({ id: brand, label: brand }))
    }
  };

  const filtersForAction: Record<string, any> = {};
  const brandParams = searchParams['brand'];
  if (brandParams) {
    filtersForAction.brands = Array.isArray(brandParams) ? brandParams : [brandParams];
  }
  if (searchParams.priceMin) filtersForAction.priceMin = parseInt(searchParams.priceMin as string, 10);
  if (searchParams.priceMax) filtersForAction.priceMax = parseInt(searchParams.priceMax as string, 10);

  const { products, count, totalPages } = await getProducts({
    categorySlug: categorySlug,
    query: currentQuery,
    sortBy: currentSort,
    page: currentPage,
    limit: itemsPerPage,
    filters: filtersForAction
  });

  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Products', href: '/products' }
  ];
  if (categoryDetails) {
    breadcrumbItems.push({ label: categoryDetails.name, href: `/products?category=${categoryDetails.slug}` });
  } else if (searchParams.q) {
    breadcrumbItems.push({ label: `Search results for "${searchParams.q}"`, href: `/products?q=${searchParams.q}` });
  }

  return (
    <div className="bg-zervia-50 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            {breadcrumbItems.map((item, index) => (
              <React.Fragment key={item.href}>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link href={item.href} className="text-sm text-zervia-600 hover:text-zervia-800">
                      {item.label}
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                {index < breadcrumbItems.length - 1 && (
                  <BreadcrumbSeparator />
                )}
              </React.Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>

        <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-zervia-900 mb-1">
              {categoryDetails ? categoryDetails.name : (currentQuery ? 'Search Results' : 'All Products')}
            </h1>
            <p className="text-zervia-600">
              Showing {products.length} of {count} {count === 1 ? 'product' : 'products'} {currentQuery ? `for "${currentQuery}"` : ''}
            </p>
          </div>
          <MobileFilters filterData={filterData} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="hidden lg:block lg:col-span-1">
            <ProductFilters filterData={filterData} />
          </div>

          <div className="lg:col-span-3">
            <div className="flex items-center justify-between mb-6 p-4 bg-white rounded-lg shadow-sm">
              <ProductSort />
              <span> {/* Placeholder */} </span>
            </div>

            {products.length > 0 ? (
              <>
                <ProductGrid products={products as ProductListingItem[]} />
                
                {totalPages > 1 && (
                  <PaginationControls 
                    currentPage={currentPage} 
                    totalPages={totalPages}
                  />
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