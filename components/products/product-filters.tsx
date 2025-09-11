"use client"

import * as React from "react"
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Suspense } from "react"
import { Slider } from "../ui/slider"
import { Checkbox } from "../ui/checkbox"
import { Button } from "../ui/button"
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion"

// Basic types for filter options passed from server
export type FilterOption = {
  id: string // Usually the slug or value
  label: string // Display name
  count?: number // Optional count
}

export type FilterGroupData = {
  id: string // e.g., 'category', 'brand'
  name: string // Display name e.g., 'Categories', 'Brands'
  options: FilterOption[]
}

interface ProductFiltersProps {
  filterData: { // Data fetched on server
    categories: FilterGroupData;
    brands: FilterGroupData;
    // Add colors, sizes later if needed
  };
  className?: string;
}

// Inner component that uses the hook
function ProductFiltersContent({
  filterData,
  className
}: ProductFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Get current filters from URL
  const currentFilters = React.useMemo(() => {
    const filters: Record<string, string[]> = {
      [filterData.categories.id]: [],
      [filterData.brands.id]: [],
      price: ['0', '1000']
    };
    
    filterData.categories.options.forEach(opt => {
        if (searchParams.has(filterData.categories.id, opt.id)) {
            filters[filterData.categories.id].push(opt.id);
        }
    });
    
    filterData.brands.options.forEach(opt => {
        if (searchParams.has(filterData.brands.id, opt.id)) {
            filters[filterData.brands.id].push(opt.id);
        }
    });
    
    // Price range - get min/max from URL
    filters.price = [
        searchParams.get('priceMin') || '0',
        searchParams.get('priceMax') || '1000' // Default max, fetch dynamically later
    ];
    
    return filters;
  }, [searchParams, filterData]);

  const [localPriceRange, setLocalPriceRange] = React.useState<[number, number]>(
     [parseInt(currentFilters.price?.[0] || '0'), parseInt(currentFilters.price?.[1] || '1000')] 
  );

  // Local state for pending filters (not yet applied)
  const [pendingFilters, setPendingFilters] = React.useState<Record<string, string[]>>({});
  const [hasPendingChanges, setHasPendingChanges] = React.useState(false);

  React.useEffect(() => {
     // Update local price range if URL changes externally
     setLocalPriceRange([
       parseInt(searchParams.get('priceMin') || '0'),
       parseInt(searchParams.get('priceMax') || '1000')
     ]);
     // Reset pending filters when URL changes externally
     setPendingFilters({});
     setHasPendingChanges(false);
  }, [searchParams]);

  const handleFilterChange = (filterType: string, optionId: string, checked: boolean) => {
    // Store changes in local state instead of immediately applying
    setPendingFilters(prev => {
      const current = prev[filterType] || [...(currentFilters[filterType] || [])];
      let updated;
      
      if (checked) {
        updated = current.includes(optionId) ? current : [...current, optionId];
      } else {
        updated = current.filter(val => val !== optionId);
      }
      
      const newPending = { ...prev, [filterType]: updated };
      setHasPendingChanges(true);
      return newPending;
    });
  };
  
  const handlePriceChange = (value: number[]) => {
    setLocalPriceRange([value[0], value[1]]);
    setHasPendingChanges(true);
  }
  
  // Apply all pending filters at once
  const applyFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    
    // Clear existing filter params
    filterData.categories.options.forEach(opt => params.delete(filterData.categories.id));
    filterData.brands.options.forEach(opt => params.delete(filterData.brands.id));
    params.delete('priceMin');
    params.delete('priceMax');
    
    // Apply pending category and brand filters
    Object.entries(pendingFilters).forEach(([filterType, values]) => {
      values.forEach(value => params.append(filterType, value));
    });
    
    // Apply current filters that don't have pending changes
    Object.entries(currentFilters).forEach(([filterType, values]) => {
      if (!pendingFilters[filterType] && filterType !== 'price') {
        values.forEach(value => params.append(filterType, value));
      }
    });
    
    // Apply price range
    params.set('priceMin', localPriceRange[0].toString());
    params.set('priceMax', localPriceRange[1].toString());
    params.set('page', '1'); // Reset page
    
    router.replace(`${pathname}?${params.toString()}`);
    setPendingFilters({});
    setHasPendingChanges(false);
  };

  const handleClearFilters = () => {
     const params = new URLSearchParams();
     // Keep essential params like query or sort if needed, otherwise clear all
     if (searchParams.has('q')) params.set('q', searchParams.get('q')!);
     if (searchParams.has('sort')) params.set('sort', searchParams.get('sort')!);
     if (searchParams.has('category')) params.set('category', searchParams.get('category')!);
     // Navigate to base path or path with minimal params
     router.replace(`${pathname}?${params.toString()}`);
     setPendingFilters({});
     setHasPendingChanges(false);
  }

  const resetPendingFilters = () => {
    setPendingFilters({});
    setHasPendingChanges(false);
    setLocalPriceRange([
      parseInt(searchParams.get('priceMin') || '0'),
      parseInt(searchParams.get('priceMax') || '1000')
    ]);
  }

  // Get effective filter values (current + pending)
  const getEffectiveFilters = (filterType: string) => {
    return pendingFilters[filterType] || currentFilters[filterType] || [];
  };
  
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  }
  
  const renderFilterGroup = (group: FilterGroupData) => (
    <div className="space-y-2">
      {group.options.map((option) => (
        <div key={option.id} className="flex items-center space-x-2">
          <Checkbox
            id={`${group.id}-${option.id}`}
            checked={getEffectiveFilters(group.id).includes(option.id)}
            onCheckedChange={(checked) => {
              handleFilterChange(group.id, option.id, !!checked);
            }}
          />
          <label
            htmlFor={`${group.id}-${option.id}`}
            className="text-sm text-gray-700 cursor-pointer hover:text-gray-900"
          >
            {option.label} {option.count !== undefined && <span className="text-gray-500 text-xs">({option.count})</span>}
          </label>
        </div>
      ))}
    </div>
  )
  
  // TODO: Fetch actual min/max price from data later
  const overallMinPrice = 0;
  const overallMaxPrice = 1000; // Placeholder max price

  return (
    <div className={className}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-zervia-900">Filters</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClearFilters}
          className="text-sm text-zervia-600 hover:text-zervia-900 px-2"
        >
          Clear all
        </Button>
      </div>

      {/* Apply/Reset Filter Buttons */}
      {hasPendingChanges && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg border">
          <p className="text-sm text-gray-600 mb-3">You have unsaved filter changes</p>
          <div className="flex gap-2">
            <Button
              onClick={applyFilters}
              size="sm"
              className="flex-1 bg-zervia-600 hover:bg-zervia-700 text-white"
            >
              Apply Filters
            </Button>
            <Button
              onClick={resetPendingFilters}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              Reset
            </Button>
          </div>
        </div>
      )}
      
      <Accordion type="multiple" defaultValue={["category", "price", "brand"]} className="w-full">
        {/* Categories */}
        {filterData.categories && filterData.categories.options.length > 0 && (
          <AccordionItem value="category">
            <AccordionTrigger className="text-sm font-medium py-3 hover:no-underline">
              {filterData.categories.name}
            </AccordionTrigger>
            <AccordionContent className="pt-1 pb-3">
              {renderFilterGroup(filterData.categories)}
            </AccordionContent>
          </AccordionItem>
        )}
        
        {/* Price Range */}
        <AccordionItem value="price">
          <AccordionTrigger className="text-sm font-medium py-3 hover:no-underline">
            Price Range
          </AccordionTrigger>
          <AccordionContent className="pt-1 pb-3">
            <div className="pt-2 px-1">
              <Slider
                min={overallMinPrice}
                max={overallMaxPrice} 
                step={10} // Adjust step as needed
                value={localPriceRange}
                onValueChange={handlePriceChange}
                className="mb-4"
              />
              <div className="flex justify-between text-sm text-gray-700">
                <span>{formatPrice(localPriceRange[0])}</span>
                <span>{formatPrice(localPriceRange[1])}</span>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
        
        {/* Brands */}
         {filterData.brands && filterData.brands.options.length > 0 && (
          <AccordionItem value="brand">
            <AccordionTrigger className="text-sm font-medium py-3 hover:no-underline">
               {filterData.brands.name}
            </AccordionTrigger>
            <AccordionContent className="pt-1 pb-3">
              {renderFilterGroup(filterData.brands)}
            </AccordionContent>
          </AccordionItem>
        )}
        
        {/* TODO: Add AccordionItem for Colors when data is available */}
        {/* TODO: Add AccordionItem for Sizes when data is available */}
        
      </Accordion>
    </div>
  )
}

// Export the wrapper component with Suspense
export function ProductFilters(props: ProductFiltersProps) {
  return (
    <Suspense fallback={<div className="animate-pulse bg-gray-100 h-[400px] rounded-md"></div>}>
      <ProductFiltersContent {...props} />
    </Suspense>
  );
} 