"use client"

import * as React from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet"
import { ProductFilters, FilterGroup } from "./product-filters"

interface MobileFiltersProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  categories: FilterGroup
  colors: FilterGroup
  sizes: FilterGroup
  brands: FilterGroup
  priceRange: {
    min: number
    max: number
    currentMin: number
    currentMax: number
  }
  onFilterChange: (filterType: string, value: any) => void
  onPriceChange: (min: number, max: number) => void
  onClearFilters: () => void
  onApplyFilters: () => void
  selectedFilterCount: number
}

export function MobileFilters({
  open,
  onOpenChange,
  categories,
  colors,
  sizes,
  brands,
  priceRange,
  onFilterChange,
  onPriceChange,
  onClearFilters,
  onApplyFilters,
  selectedFilterCount
}: MobileFiltersProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-full sm:max-w-md p-0">
        <SheetHeader className="px-4 py-3 border-b sticky top-0 bg-white z-10">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-lg font-medium">Filters</SheetTitle>
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          {selectedFilterCount > 0 && (
            <div className="text-sm text-zervia-500">
              {selectedFilterCount} {selectedFilterCount === 1 ? 'filter' : 'filters'} applied
            </div>
          )}
        </SheetHeader>
        
        <div className="overflow-y-auto h-[calc(100vh-8rem)]">
          <ProductFilters
            categories={categories}
            colors={colors}
            sizes={sizes}
            brands={brands}
            priceRange={priceRange}
            onFilterChange={onFilterChange}
            onPriceChange={onPriceChange}
            onClearFilters={onClearFilters}
            className="p-4"
          />
        </div>
        
        <SheetFooter className="px-4 py-3 border-t sticky bottom-0 bg-white">
          <div className="flex w-full gap-2">
            <Button 
              variant="outline" 
              onClick={onClearFilters} 
              className="flex-1"
            >
              Clear All
            </Button>
            <Button 
              onClick={() => {
                onApplyFilters()
                onOpenChange(false)
              }}
              className="flex-1 bg-zervia-600 hover:bg-zervia-700"
            >
              Apply Filters{selectedFilterCount > 0 && ` (${selectedFilterCount})`}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
} 