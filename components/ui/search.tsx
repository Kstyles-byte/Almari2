"use client"

import * as React from "react"
import { Search as SearchIcon, X } from "lucide-react"
import { cn } from "../../lib/utils"

interface SearchProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onSearch?: (value: string) => void;
  onClear?: () => void;
}

const Search = React.forwardRef<HTMLInputElement, SearchProps>(
  ({ className, onSearch, onClear, ...props }, ref) => {
    const [value, setValue] = React.useState(props.defaultValue || "")
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value
      setValue(newValue)
      if (props.onChange) {
        props.onChange(e)
      }
    }
    
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && onSearch) {
        e.preventDefault()
        onSearch(value as string)
      }
    }
    
    const handleClear = () => {
      setValue("")
      if (onClear) {
        onClear()
      }
    }
    
    return (
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
        <input
          type="text"
          className={cn(
            "flex h-10 w-full rounded-md border border-gray-200 bg-white pl-10 pr-10 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zervia-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          ref={ref}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          {...props}
        />
        {value && value.toString().length > 0 && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    )
  }
)
Search.displayName = "Search"

export { Search } 