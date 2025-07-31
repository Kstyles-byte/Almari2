"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Filter, Grid2X2, List, ArrowDown, ArrowUp, Star, Heart, ShoppingCart } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '../ui/breadcrumb';
import { cn } from "../../lib/utils";
import { EmptyState } from '../ui/empty-state';
import { ProductFilters } from './product-filters';
import { MobileFilters } from './mobile-filters';
import { PaginationControls } from './pagination-controls';
import { ProductSort } from './product-sort';
import { RecentlyViewedProducts } from './recently-viewed-products';
import { getProducts } from '@/actions/products';
import { ProductGrid } from './product-grid';
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
  inventory: number;
  initialInWishlist?: boolean;
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

interface ProductsListingClientProps {
  searchParams?: SearchParams; // Made optional since we'll use useSearchParams
}

const ProductsListingClient: React.FC<ProductsListingClientProps> = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Extract search params from URL
  const page = searchParams.get('page') || '1';
  const sort = searchParams.get('sort') || 'featured';
  const query = searchParams.get('q') || '';
  const category = searchParams.get('category');
  const brand = searchParams.get('brand');
  const priceMin = searchParams.get('priceMin');
  const priceMax = searchParams.get('priceMax');

  // State management
  const [products, setProducts] = useState<ProductListingItem[]>([]);
  const [count, setCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [categoryDetails, setCategoryDetails] = useState<any>(null);
  const [rootCategories, setRootCategories] = useState<Category[]>([]);
  const [allBrandsData, setAllBrandsData] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Parse values
  const currentPage = parseInt(page, 10);
  const currentSort = sort;
  const currentQuery = query;
  const categorySlug = category;
  const brandParams = brand;
  const priceMinValue = priceMin ? parseInt(priceMin, 10) : undefined;
  const priceMaxValue = priceMax ? parseInt(priceMax, 10) : undefined;
  const itemsPerPage = 12;

  // Fetch data on component mount and when search params change
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch category details, root categories, and brands
        const [categoryRes, rootCategoriesRes, brandsRes] = await Promise.all([
          categorySlug ? getCategoryBySlug(categorySlug) : Promise.resolve(null),
          getRootCategories(),
          getAllBrands()
        ]);

console.log("Category Details:", categoryRes);
        setCategoryDetails(categoryRes);
        setRootCategories(rootCategoriesRes);
        setAllBrandsData(brandsRes);

        // Build filters for getProducts action
        const filtersForAction: Record<string, any> = {};
        if (brandParams) {
          filtersForAction.brands = Array.isArray(brandParams) ? brandParams : [brandParams];
        }
        if (priceMinValue !== undefined) filtersForAction.priceMin = priceMinValue;
        if (priceMaxValue !== undefined) filtersForAction.priceMax = priceMaxValue;

        // Fetch products
        const { products: rawProducts, count: productCount, totalPages: pages } = await getProducts({
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
            try {
              const { inWishlist } = await isInWishlist(product.id);
              return { ...product, initialInWishlist: inWishlist };
            } catch (err) {
              // If wishlist check fails, just return product without wishlist status
              return { ...product, initialInWishlist: false };
            }
          })
        );

console.log("Products with Wishlist:", productsWithWishlistStatus);
        setProducts(productsWithWishlistStatus);
        setCount(productCount);
        setTotalPages(pages);

      } catch (err) {
        console.error("Failed to fetch products data:", err);
console.error("Error fetching products:", err);
        setError("Could not load products. Please try again later.");
        setProducts([]);
        setCount(0);
        setTotalPages(0);
      } finally {
console.log("Loading Finished");
      setIsLoading(false);
      }
    };

    fetchData();
  }, [categorySlug, currentQuery, currentSort, currentPage, brandParams, priceMinValue, priceMaxValue]);

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

  if (isLoading) {
    return (
      <div className="bg-zervia-50 min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">Loading products...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-zervia-50 min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12 text-red-600">{error}</div>
        </div>
      </div>
    );
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
                <ProductGrid products={products} />
                
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
};

export default ProductsListingClient;
