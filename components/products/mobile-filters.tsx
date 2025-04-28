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
        <ProductFilters filterData={filterData} />
        <div className="mt-6 sticky bottom-0 bg-white py-4 border-t">
          <SheetClose asChild>
            <Button className="w-full">Apply Filters</Button>
          </SheetClose>
        </div>
      </SheetContent>
    </Sheet>
  )
} 