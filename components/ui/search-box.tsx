"use client"

import * as React from "react"
import { Search as SearchIcon, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { cn } from "../../lib/utils"
import { searchProductSuggestions, getPopularSearchTerms } from "@/actions/search"
import { SearchSuggestions } from "./search-suggestions"
import { useDebounce } from "@/lib/hooks/use-debounce"

interface SearchBoxProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  initialQuery?: string;
  placeholder?: string;
  showSuggestions?: boolean;
}

export function SearchBox({ 
  className, 
  initialQuery = "", 
  placeholder = "Search products...", 
  showSuggestions = true,
  ...props 
}: SearchBoxProps) {
  const router = useRouter()
  const [query, setQuery] = React.useState(initialQuery)
  const [isFocused, setIsFocused] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  const [suggestions, setSuggestions] = React.useState<any[]>([])
  const [showSuggestionsDropdown, setShowSuggestionsDropdown] = React.useState(false)
  const [popularTerms, setPopularTerms] = React.useState<string[]>([])
  
  const debouncedQuery = useDebounce(query, 300)
  
  // Fetch popular search terms on initial load
  React.useEffect(() => {
    if (showSuggestions) {
      getPopularSearchTerms().then((data) => {
        setPopularTerms(data.terms)
      })
    }
  }, [showSuggestions])
  
  // Fetch suggestions when query changes
  React.useEffect(() => {
    if (!showSuggestions) return
    
    if (debouncedQuery.trim().length < 2) {
      // Only clear suggestions if they actually exist to avoid redundant state updates
      if (suggestions.length > 0) setSuggestions([])
      // Only update the dropdown visibility when the value would change
      setShowSuggestionsDropdown(prev => (prev !== isFocused ? isFocused : prev))
      return
    }
    
    const fetchSuggestions = async () => {
      setIsLoading(true)
      try {
        const result = await searchProductSuggestions(debouncedQuery)
        setSuggestions(result.suggestions)
      } catch (error) {
        console.error("Error fetching suggestions:", error)
        setSuggestions([])
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchSuggestions()
    setShowSuggestionsDropdown(true)
  }, [debouncedQuery, showSuggestions, isFocused, suggestions.length])
  
  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (query.trim()) {
      setShowSuggestionsDropdown(false)
      router.push(`/products?q=${encodeURIComponent(query.trim())}`)
    }
  }
  
  const handleClear = () => {
    setQuery("")
    setSuggestions([])
  }
  
  const handleFocus = () => {
    setIsFocused(true)
    if (showSuggestions) {
      setShowSuggestionsDropdown(true)
    }
  }
  
  const handleBlur = () => {
    setIsFocused(false)
    // Don't hide suggestions immediately to allow clicking on them
  }
  
  const handlePopularTermClick = (term: string) => {
    setQuery(term)
    handleSearch()
  }
  
  return (
    <div className={cn("relative", className)} {...props}>
      <form onSubmit={handleSearch} className="relative">
        <SearchIcon className={cn(
          "absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transition-colors",
          isFocused ? "text-zervia-500" : "text-gray-500"
        )} />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={cn(
            "h-10 w-full rounded-full border pr-10 pl-10 py-2 text-sm transition-all",
            "focus:ring-2 focus:outline-none",
            isFocused 
              ? "border-zervia-500 ring-zervia-500/20" 
              : "border-gray-200 hover:border-gray-300",
            "placeholder:text-gray-500"
          )}
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-10 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        <button
          type="submit"
          className={cn(
            "absolute right-2 top-1/2 -translate-y-1/2",
            "h-6 w-6 flex items-center justify-center",
            "rounded-full text-xs bg-zervia-500 text-white",
            "hover:bg-zervia-600 transition-colors"
          )}
          aria-label="Search"
        >
          <span className="sr-only">Search</span>
          <SearchIcon className="h-3 w-3" />
        </button>
      </form>
      
      {showSuggestions && (
        <>
          {/* Product suggestions */}
          {query.trim().length >= 2 && (
            <SearchSuggestions
              isOpen={showSuggestionsDropdown}
              isLoading={isLoading}
              suggestions={suggestions}
              searchQuery={query}
              onClickOutside={() => setShowSuggestionsDropdown(false)}
            />
          )}
          
          {/* Popular search terms (show when focused with empty query) */}
          {query.trim().length < 2 && popularTerms.length > 0 && showSuggestionsDropdown && (
            <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-md border border-gray-200 bg-white p-2 shadow-lg">
              <div className="mb-2 px-2 text-xs font-medium text-gray-500">
                Popular searches
              </div>
              <div className="flex flex-wrap gap-2">
                {popularTerms.map((term) => (
                  <button
                    key={term}
                    onClick={() => handlePopularTermClick(term)}
                    className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs hover:bg-gray-100"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
} 