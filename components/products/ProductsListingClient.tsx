"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
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
import { ProductGrid, type Product } from './product-grid';
import { getCategoryBySlug, getRootCategories } from '@/actions/content';
import { getAllBrands } from '@/actions/brands';
import type { Tables } from '../../types/supabase';
import { isInWishlist } from '@/actions/wishlist';

type Category = Tables<'Category'>;

interface ProductsListingClientProps {
 // Made optional since we'll use useSearchParams
}

const ProductsListingClient: React.FC<ProductsListingClientProps> = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  
  // State management
  const [allProducts, setAllProducts] = useState<Product[]>([]); // Store all products
  const [categoryDetails, setCategoryDetails] = useState<any>(null);
  const [rootCategories, setRootCategories] = useState<Category[]>([]);
  const [allBrandsData, setAllBrandsData] = useState<string[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true); // Only for initial data fetch
  const [error, setError] = useState<string | null>(null);

  // Create filters from URL params
  const filters = useMemo(() => {
    const category = searchParams.get('category');
    const query = searchParams.get('q') || '';
    const brands = searchParams.getAll('brand').map(brand => decodeURIComponent(brand)); // Decode URL-encoded brands
    const priceMin = searchParams.get('priceMin');
    const priceMax = searchParams.get('priceMax');
    const sort = searchParams.get('sort') || 'newest';
    const page = parseInt(searchParams.get('page') || '1', 10);


    return {
      category,
      query,
      brands,
      priceMin: priceMin ? parseInt(priceMin, 10) : undefined,
      priceMax: priceMax ? parseInt(priceMax, 10) : undefined,
      sort,
      page
    };
  }, [searchParams]);

  // Products are already filtered and sorted from server
  // Just apply pagination for display
  const itemsPerPage = 12;
  const totalPages = Math.ceil(allProducts.length / itemsPerPage);
  const startIndex = (filters.page - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProducts = allProducts.slice(startIndex, endIndex);

  // Fetch filtered data from server
  const fetchFilteredData = useCallback(async () => {
    try {
      setIsInitialLoading(true);
      setError(null);

      const category = searchParams.get('category');
      const query = searchParams.get('q') || '';

      // Fetch category details, root categories, and brands once
      const [categoryRes, rootCategoriesRes, brandsRes] = await Promise.all([
        category ? getCategoryBySlug(category) : Promise.resolve(null),
        getRootCategories(),
        getAllBrands()
      ]);

      setCategoryDetails(categoryRes);
      setRootCategories(rootCategoriesRes);
      setAllBrandsData(brandsRes);

      // Fetch products with current filters applied on server
      const { products: rawProducts } = await getProducts({
        categorySlug: category || undefined,
        query: query,
        sortBy: filters.sort,
        page: 1,
        limit: 1000,
        filters: {
          brands: filters.brands.length > 0 ? filters.brands : undefined,
          priceMin: filters.priceMin,
          priceMax: filters.priceMax
        }
      });

      // Map database products to ProductGrid format
      const productsWithWishlistStatus: Product[] = rawProducts.map((product: any) => ({
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: product.price,
        image: product.image || '/placeholder-product.jpg',
        rating: 4.5,
        reviews: product.reviews || 0,
        vendor: product.vendor || 'No Vendor', // Improved fallback text for products without vendors
        isNew: false,
        initialInWishlist: false,
        inventory: product.inventory || 0
      }));

      setAllProducts(productsWithWishlistStatus);

    } catch (err) {
      console.error("Failed to fetch products data:", err);
      setError("Failed to load products. Please try again.");
    } finally {
      setIsInitialLoading(false);
    }
  }, [filters]);

  // Fetch data when filters change
  useEffect(() => {
    fetchFilteredData();
  }, [fetchFilteredData]);

  // Set up filter data
  const filterData = useMemo(() => ({
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
  }), [rootCategories, allBrandsData]);

  // Build breadcrumbs
  const breadcrumbItems = useMemo(() => {
    const items = [
      { label: 'Home', href: '/' },
      { label: 'Products', href: '/products' }
    ];
    
    if (categoryDetails) {
      items.push({ label: categoryDetails.name, href: `/products?category=${categoryDetails.slug}` });
    } else if (filters.query) {
      items.push({ label: `Search results for "${filters.query}"`, href: `/products?q=${filters.query}` });
    }
    
    return items;
  }, [categoryDetails, filters.query]);

  if (isInitialLoading) {
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
              {categoryDetails ? categoryDetails.name : (filters.query ? 'Search Results' : 'All Products')}
            </h1>
            <p className="text-zervia-600">
              Showing {paginatedProducts.length} of {allProducts.length} {allProducts.length === 1 ? 'product' : 'products'} {filters.query ? `for "${filters.query}"` : ''}
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

            {paginatedProducts.length > 0 ? (
              <>
                <ProductGrid products={paginatedProducts} />
                
                {totalPages > 1 && (
                  <PaginationControls 
                    currentPage={filters.page} 
                    totalPages={totalPages}
                  />
                )}
              </>
            ) : (
              <EmptyState 
                title="No Products Found"
                description={filters.query 
                  ? `We couldn't find any products matching "${filters.query}". Try adjusting your search or filters.`
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