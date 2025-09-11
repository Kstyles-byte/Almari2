"use client"

import * as React from "react"
import { Filter } from "lucide-react"
import { Button } from "../ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose
} from "../ui/sheet"
import { ProductFilters, FilterGroupData } from './product-filters'

interface MobileFiltersProps {
  filterData: {
    categories: FilterGroupData
    brands: FilterGroupData
  }
}

export function MobileFilters({ filterData }: MobileFiltersProps) {
  const sheetCloseRef = React.useRef<HTMLButtonElement>(null)
  
  const closeSheet = () => {
    sheetCloseRef.current?.click()
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="lg:hidden flex items-center">
          <Filter className="mr-2 h-4 w-4" /> Filters
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[300px] sm:w-[400px] overflow-y-auto">
        <SheetHeader className="mb-4">
          <SheetTitle>Filters</SheetTitle>
        </SheetHeader>
        <ProductFilters 
          filterData={filterData} 
          onFiltersApplied={closeSheet}
        />
        {/* Hidden SheetClose button controlled programmatically */}
        <SheetClose ref={sheetCloseRef} className="hidden" />
      </SheetContent>
    </Sheet>
  )
} 