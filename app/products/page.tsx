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
import type { Tables } from '../../types/supabase';
import { isInWishlist } from '@/actions/wishlist';

type Category = Tables<'Category'>;

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

// Type for search params coming from the URL
type SearchParams = {
  category?: string;
  sort?: string;
  page?: string;
  view?: 'grid' | 'list';
  q?: string;
  brand?: string | string[];
  priceMin?: string;
  priceMax?: string;
  [key: string]: string | string[] | undefined;
};

interface ProductListingPageProps {
  searchParams: SearchParams;
}

const Placeholder = ({ name }: { name: string }) => (
  <div className="p-4 border rounded bg-gray-100 text-gray-500 text-sm">
    Placeholder for {name}
  </div>
);

// This is the main server component - must be kept synchronous
export default function ProductListingPage({ 
  searchParams 
}: ProductListingPageProps) {
  // Extract all needed values here using bracket notation
  // This is the ONLY place we access searchParams directly
  const page = Object.hasOwn(searchParams, 'page') ? searchParams['page'] : '1';
  const sort = Object.hasOwn(searchParams, 'sort') ? searchParams['sort'] : 'featured';
  const query = Object.hasOwn(searchParams, 'q') ? searchParams['q'] : '';
  const category = Object.hasOwn(searchParams, 'category') ? searchParams['category'] : undefined;
  const brand = Object.hasOwn(searchParams, 'brand') ? searchParams['brand'] : undefined;
  const priceMin = Object.hasOwn(searchParams, 'priceMin') ? searchParams['priceMin'] : undefined;
  const priceMax = Object.hasOwn(searchParams, 'priceMax') ? searchParams['priceMax'] : undefined;
  
  // Pass individual parameters to async component
  return (
    <ProductListingContent 
      page={page}
      sort={sort}
      query={query}
      category={category}
      brand={brand}
      priceMin={priceMin}
      priceMax={priceMax}
    />
  );
}

// Async component with individual props instead of searchParams
async function ProductListingContent({
  page = '1',
  sort = 'featured',
  query = '',
  category,
  brand,
  priceMin,
  priceMax
}: {
  page?: string;
  sort?: string;
  query?: string;
  category?: string;
  brand?: string | string[];
  priceMin?: string;
  priceMax?: string;
}) {
  // Parse values
  const currentPage = parseInt(page, 10);
  const currentSort = sort;
  const currentQuery = query;
  const categorySlug = category;
  const brandParams = brand;
  const priceMinValue = priceMin ? parseInt(priceMin, 10) : undefined;
  const priceMaxValue = priceMax ? parseInt(priceMax, 10) : undefined;
  const itemsPerPage = 12;

  // Fetch data using Promise.all
  const [categoryDetails, rootCategories, allBrandsData] = await Promise.all([
    categorySlug ? getCategoryBySlug(categorySlug) : Promise.resolve(null),
    getRootCategories(),
    getAllBrands()
  ]);

  // Set up filter data
  const filterData = {
    categories: {
      id: 'category',
      name: 'Categories',
      options: rootCategories.map((cat: Category) => ({ id: cat.slug, label: cat.name }))
    },
    brands: {
      id: 'brand',
      name: 'Brands',
      options: allBrandsData.map((b: string) => ({ id: b, label: b }))
    }
  };

  // Build filters for getProducts action
  const filtersForAction: Record<string, any> = {};
  if (brandParams) {
    filtersForAction.brands = Array.isArray(brandParams) ? brandParams : [brandParams];
  }
  if (priceMinValue !== undefined) filtersForAction.priceMin = priceMinValue;
  if (priceMaxValue !== undefined) filtersForAction.priceMax = priceMaxValue;

  // Fetch products
  const { products: rawProducts, count, totalPages } = await getProducts({
    categorySlug: categorySlug,
    query: currentQuery,
    sortBy: currentSort,
    page: currentPage,
    limit: itemsPerPage,
    filters: filtersForAction
  });

  // Augment products with wishlist status
  const productsWithWishlistStatus = await Promise.all(
    rawProducts.map(async (product: any) => {
      const { inWishlist } = await isInWishlist(product.id);
      return { ...product, initialInWishlist: inWishlist };
    })
  );

  // Build breadcrumbs
  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Products', href: '/products' }
  ];
  if (categoryDetails) {
    breadcrumbItems.push({ label: categoryDetails.name, href: `/products?category=${categoryDetails.slug}` });
  } else if (currentQuery) {
    breadcrumbItems.push({ label: `Search results for "${currentQuery}"`, href: `/products?q=${currentQuery}` });
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
              Showing {productsWithWishlistStatus.length} of {count} {count === 1 ? 'product' : 'products'} {currentQuery ? `for "${currentQuery}"` : ''}
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

            {productsWithWishlistStatus.length > 0 ? (
              <>
                <ProductGrid products={productsWithWishlistStatus} />
                
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
                  ? `We couldn't find any products matching "${currentQuery}". Try adjusting your search or filters.`
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