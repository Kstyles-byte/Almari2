'use client';

import React, { Suspense } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'; // Assuming shadcn/ui

const sortOptions = [
  { value: 'featured', label: 'Featured' },
  { value: 'newest', label: 'Newest' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  // { value: 'rating', label: 'Top Rated' } // Add back when backend supports it
];

interface ProductSortProps {
  // currentSort is derived from searchParams now
}

// Inner component that uses the hook
function ProductSortContent({}: ProductSortProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentSort = searchParams.get('sort') || 'featured';

  const handleSortChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('sort', value);
    // Reset page to 1 when sort changes
    params.set('page', '1'); 
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm text-gray-600">Sort by:</span>
      <Select value={currentSort} onValueChange={handleSortChange}>
        <SelectTrigger className="w-[180px] h-9 text-sm">
          <SelectValue placeholder="Select sorting" />
        </SelectTrigger>
        <SelectContent>
          {sortOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

// Export the wrapper component with Suspense
export function ProductSort(props: ProductSortProps) {
  return (
    <Suspense fallback={<div className="flex items-center space-x-2"><span className="text-sm text-gray-600">Sort by:</span><div className="w-[180px] h-9 bg-gray-100 animate-pulse rounded-md"></div></div>}>
      <ProductSortContent {...props} />
    </Suspense>
  );
} 