import React from 'react';
import ProductsListingClient from '../../components/products/ProductsListingClient';

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

// This is now a simple wrapper - the client component handles search params directly
export default function ProductListingPage({ 
  searchParams 
}: ProductListingPageProps) {
  // The client component will handle search params directly via useSearchParams
  return <ProductsListingClient />;
}
