"use client"

import * as React from "react"
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
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

export function ProductFilters({
  filterData,
  className
}: ProductFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Get current filters from URL
  const currentFilters = React.useMemo(() => {
    const filters: Record<string, string[]> = {};
    filterData.categories.options.forEach(opt => {
        if (searchParams.has(filterData.categories.id, opt.id)) {
            if (!filters[filterData.categories.id]) filters[filterData.categories.id] = [];
            filters[filterData.categories.id].push(opt.id);
        }
    });
     filterData.brands.options.forEach(opt => {
        if (searchParams.has(filterData.brands.id, opt.id)) {
            if (!filters[filterData.brands.id]) filters[filterData.brands.id] = [];
            filters[filterData.brands.id].push(opt.id);
        }
    });
    // TODO: Add logic for colors, sizes
    
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

  React.useEffect(() => {
     // Update local price range if URL changes externally
     setLocalPriceRange([
       parseInt(searchParams.get('priceMin') || '0'),
       parseInt(searchParams.get('priceMax') || '1000')
     ]);
  }, [searchParams]);

  const handleFilterChange = (filterType: string, optionId: string, checked: boolean) => {
    const params = new URLSearchParams(searchParams.toString());
    
    // Handle multi-select filters (like category, brand)
    const currentValues = params.getAll(filterType);
    if (checked) {
      if (!currentValues.includes(optionId)) {
        params.append(filterType, optionId);
      }
    } else {
      params.delete(filterType); // Delete all existing values
      currentValues.filter(val => val !== optionId).forEach(val => params.append(filterType, val)); // Re-add others
    }
    
    params.set('page', '1'); // Reset page when filters change
    router.push(`${pathname}?${params.toString()}`);
  };
  
  const handlePriceChange = (value: number[]) => {
    setLocalPriceRange([value[0], value[1]]);
  }
  
  const handlePriceChangeCommitted = (value: number[]) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('priceMin', value[0].toString());
    params.set('priceMax', value[1].toString());
    params.set('page', '1'); // Reset page
    router.push(`${pathname}?${params.toString()}`);
  }

  const handleClearFilters = () => {
     const params = new URLSearchParams();
     // Keep essential params like query or sort if needed, otherwise clear all
     if (searchParams.has('q')) params.set('q', searchParams.get('q')!);
     if (searchParams.has('sort')) params.set('sort', searchParams.get('sort')!);
     // Navigate to base path or path with minimal params
     router.push(`${pathname}?${params.toString()}`);
  }
  
  const formatPrice = (price: number) => {
    // Assuming NGN currency
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }
  
  const renderFilterGroup = (group: FilterGroupData) => (
    <div className="space-y-2">
      {group.options.map((option) => (
        <div key={option.id} className="flex items-center space-x-2">
          <Checkbox
            id={`${group.id}-${option.id}`}
            checked={currentFilters[group.id]?.includes(option.id)}
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
                onValueCommit={handlePriceChangeCommitted}
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