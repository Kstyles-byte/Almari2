import * as React from "react"
import { Star } from "lucide-react"

import { cn } from "../../lib/utils"

interface StarRatingProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  rating: number
  maxRating?: number
  size?: "sm" | "md" | "lg"
  readOnly?: boolean
  onChange?: (newRating: number) => void
}

export function StarRating({
  rating,
  maxRating = 5,
  size = "md",
  readOnly = false,
  onChange,
  className,
  ...props
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = React.useState<number | null>(null)
  
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  }
  
  const handleClick = (index: number) => {
    if (!readOnly && onChange) {
      onChange(index + 1)
    }
  }
  
  const handleMouseEnter = (index: number) => {
    if (!readOnly) {
      setHoverRating(index + 1)
    }
  }
  
  const handleMouseLeave = () => {
    if (!readOnly) {
      setHoverRating(null)
    }
  }
  
  const displayRating = hoverRating !== null ? hoverRating : rating
  
  return (
    <div 
      className={cn("flex items-center", className)}
      {...props}
    >
      {Array.from({ length: maxRating }).map((_, index) => {
        const isFilled = index < displayRating
        
        return (
          <span
            key={index}
            className={cn(
              "cursor-default inline-flex",
              !readOnly && "cursor-pointer",
              sizeClasses[size]
            )}
            onClick={() => handleClick(index)}
            onMouseEnter={() => handleMouseEnter(index)}
            onMouseLeave={handleMouseLeave}
            role={!readOnly ? "button" : undefined}
            tabIndex={!readOnly ? 0 : undefined}
            aria-label={!readOnly ? `Rate ${index + 1} out of ${maxRating}` : `Rating is ${rating} out of ${maxRating}`}
          >
            <Star
              className={cn(
                "transition-colors",
                isFilled ? "fill-primary text-primary" : "fill-transparent text-muted-foreground"
              )}
              strokeWidth={2}
            />
          </span>
        )
      })}
      
      {props.children}
    </div>
  )
}

export function DisplayRating({
  rating,
  maxRating = 5,
  size = "sm",
  showValue = false,
  className,
  ...props
}: {
  rating: number
  maxRating?: number
  size?: "sm" | "md" | "lg"
  showValue?: boolean
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex items-center gap-1", className)} {...props}>
      <StarRating rating={rating} maxRating={maxRating} size={size} readOnly />
      {showValue && (
        <span className="text-sm font-medium text-muted-foreground">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  )
} 