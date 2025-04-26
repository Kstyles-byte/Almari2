"use client"

import * as React from "react"
import { Slider } from "../ui/slider"
import { Checkbox } from "../ui/checkbox"
import { Button } from "../ui/button"
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion"

export type FilterOption = {
  id: string
  label: string
  count?: number
}

export type FilterGroup = {
  id: string
  name: string
  options: FilterOption[]
}

interface ProductFiltersProps {
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
  className?: string
}

export function ProductFilters({
  categories,
  colors,
  sizes,
  brands,
  priceRange,
  onFilterChange,
  onPriceChange,
  onClearFilters,
  className
}: ProductFiltersProps) {
  const [localPriceRange, setLocalPriceRange] = React.useState([
    priceRange.currentMin,
    priceRange.currentMax
  ])
  
  const handlePriceChange = (value: number[]) => {
    setLocalPriceRange(value)
  }
  
  const handlePriceChangeCommitted = () => {
    onPriceChange(localPriceRange[0], localPriceRange[1])
  }
  
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }
  
  const renderFilterGroup = (group: FilterGroup, filterType: string) => (
    <div className="space-y-2">
      {group.options.map((option) => (
        <div key={option.id} className="flex items-center space-x-2">
          <Checkbox
            id={`${filterType}-${option.id}`}
            onCheckedChange={(checked) => {
              onFilterChange(filterType, {
                id: option.id,
                checked: !!checked
              })
            }}
          />
          <label
            htmlFor={`${filterType}-${option.id}`}
            className="text-sm text-gray-700 cursor-pointer"
          >
            {option.label} {option.count !== undefined && <span className="text-gray-500">({option.count})</span>}
          </label>
        </div>
      ))}
    </div>
  )
  
  return (
    <div className={className}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Filters</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearFilters}
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          Clear all
        </Button>
      </div>
      
      <Accordion type="multiple" defaultValue={["categories", "price", "brands"]}>
        <AccordionItem value="categories">
          <AccordionTrigger className="text-sm font-medium py-2">Categories</AccordionTrigger>
          <AccordionContent>
            {renderFilterGroup(categories, 'category')}
          </AccordionContent>
        </AccordionItem>
        
        <AccordionItem value="price">
          <AccordionTrigger className="text-sm font-medium py-2">Price Range</AccordionTrigger>
          <AccordionContent>
            <div className="pt-2 px-2">
              <Slider
                min={priceRange.min}
                max={priceRange.max}
                step={10}
                value={localPriceRange}
                onValueChange={handlePriceChange}
                onValueCommit={handlePriceChangeCommitted}
                className="mb-6"
              />
              <div className="flex justify-between text-sm text-gray-700">
                <span>{formatPrice(localPriceRange[0])}</span>
                <span>{formatPrice(localPriceRange[1])}</span>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
        
        <AccordionItem value="colors">
          <AccordionTrigger className="text-sm font-medium py-2">Colors</AccordionTrigger>
          <AccordionContent>
            {renderFilterGroup(colors, 'color')}
          </AccordionContent>
        </AccordionItem>
        
        <AccordionItem value="sizes">
          <AccordionTrigger className="text-sm font-medium py-2">Sizes</AccordionTrigger>
          <AccordionContent>
            {renderFilterGroup(sizes, 'size')}
          </AccordionContent>
        </AccordionItem>
        
        <AccordionItem value="brands">
          <AccordionTrigger className="text-sm font-medium py-2">Brands</AccordionTrigger>
          <AccordionContent>
            {renderFilterGroup(brands, 'brand')}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
} 