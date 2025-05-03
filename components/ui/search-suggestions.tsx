"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { Loader2 } from "lucide-react"
import { cn } from "../../lib/utils"

interface Product {
  id: string
  name: string
  slug: string
  price: number
  image: string
  category: string
}

interface SearchSuggestionsProps {
  isOpen: boolean
  isLoading: boolean
  suggestions: Product[]
  onClickOutside: () => void
  searchQuery: string
  className?: string
}

export function SearchSuggestions({
  isOpen,
  isLoading,
  suggestions,
  onClickOutside,
  searchQuery,
  className,
}: SearchSuggestionsProps) {
  const ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onClickOutside()
      }
    }

    // Add event listener only if the dropdown is open
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen, onClickOutside])

  if (!isOpen) return null

  return (
    <div
      ref={ref}
      className={cn(
        "absolute top-full left-0 right-0 z-50 mt-1 overflow-hidden rounded-md border border-gray-200 bg-white shadow-lg",
        className
      )}
    >
      <div className="max-h-80 overflow-y-auto p-2">
        {isLoading ? (
          <div className="flex items-center justify-center p-4">
            <Loader2 className="h-5 w-5 animate-spin text-zervia-500" />
            <span className="ml-2 text-sm text-gray-500">Searching...</span>
          </div>
        ) : suggestions.length > 0 ? (
          <>
            <div className="mb-2 px-2 text-xs font-medium text-gray-500">
              {suggestions.length} result{suggestions.length !== 1 ? "s" : ""} for &quot;{searchQuery}&quot;
            </div>
            <ul>
              {suggestions.map((product) => (
                <li key={product.id}>
                  <Link
                    href={`/product/${product.slug}`}
                    className="flex items-center gap-3 rounded-md p-2 hover:bg-zervia-50"
                  >
                    <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-md bg-gray-100">
                      <Image
                        src={product.image}
                        alt={product.name}
                        width={40}
                        height={40}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <div className="truncate text-sm font-medium">{product.name}</div>
                      <div className="flex items-center">
                        <span className="text-xs text-gray-500">{product.category}</span>
                        <span className="mx-1 text-xs text-gray-300">·</span>
                        <span className="text-xs font-medium text-zervia-600">₦{product.price.toLocaleString()}</span>
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-2 border-t border-gray-100 pt-2">
              <Link
                href={`/products?q=${encodeURIComponent(searchQuery)}`}
                className="block rounded-md p-2 text-center text-sm font-medium text-zervia-600 hover:bg-zervia-50"
              >
                View all results
              </Link>
            </div>
          </>
        ) : (
          <div className="p-4 text-center">
            <p className="text-sm text-gray-500">No products found for &quot;{searchQuery}&quot;</p>
            <Link
              href={`/products?q=${encodeURIComponent(searchQuery)}`}
              className="mt-2 block text-sm font-medium text-zervia-600"
            >
              Search all products
            </Link>
          </div>
        )}
      </div>
    </div>
  )
} 