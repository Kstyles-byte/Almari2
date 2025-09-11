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

  // Filter and sort products locally
  const filteredProducts = useMemo(() => {
    let filtered = [...allProducts];

    // Apply query filter
    if (filters.query) {
      const queryLower = filters.query.toLowerCase();
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(queryLower)
      );
    }

    // Apply brand filter with proper URL decoding and case-insensitive matching
    if (filters.brands && filters.brands.length > 0) {
      filtered = filtered.filter(product => {
        const productVendor = product.vendor;
        return filters.brands.some(filterBrand => 
          productVendor.toLowerCase().trim() === filterBrand.toLowerCase().trim()
        );
      });
    }

    // Apply price filters
    if (filters.priceMin !== undefined) {
      filtered = filtered.filter(product => product.price >= filters.priceMin!);
    }
    if (filters.priceMax !== undefined) {
      filtered = filtered.filter(product => product.price <= filters.priceMax!);
    }

    // Apply sorting
    switch (filters.sort) {
      case 'price-asc':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'newest':
      default:
        // Assuming we have some way to determine newest, for now keep original order
        break;
    }

    return filtered;
  }, [allProducts, filters]);

  // Pagination
  const itemsPerPage = 12;
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (filters.page - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

  // Fetch initial data once (without filters except category/query)
  const fetchInitialData = useCallback(async () => {
    try {
      setIsInitialLoading(true);
      setError(null);

      const category = searchParams.get('category');
      const query = searchParams.get('q') || '';

      // Fetch category details, root categories, and brands
      const [categoryRes, rootCategoriesRes, brandsRes] = await Promise.all([
        category ? getCategoryBySlug(category) : Promise.resolve(null),
        getRootCategories(),
        getAllBrands()
      ]);

      setCategoryDetails(categoryRes);
      setRootCategories(rootCategoriesRes);
      setAllBrandsData(brandsRes);

      // Fetch ALL products for the current category/query (no brand/price filters)
      const { products: rawProducts } = await getProducts({
        categorySlug: category || undefined,
        query: query,
        sortBy: 'newest',
        page: 1,
        limit: 1000, // Fetch a large number to get all products
        filters: {} // No filters initially
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
        vendor: product.vendor || 'Unknown', // Use the already processed vendor field
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
  }, [searchParams.get('category'), searchParams.get('q')]);

  // Fetch data when category or search query changes
  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

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
              Showing {paginatedProducts.length} of {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'} {filters.query ? `for "${filters.query}"` : ''}
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