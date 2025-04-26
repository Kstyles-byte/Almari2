import * as React from "react"
import { X } from "lucide-react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../../lib/utils"

const tagVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        success: "border-transparent bg-green-500 text-white hover:bg-green-500/80",
        warning: "border-transparent bg-yellow-500 text-white hover:bg-yellow-500/80",
        info: "border-transparent bg-blue-500 text-white hover:bg-blue-500/80",
      },
      interactive: {
        true: "cursor-pointer",
        false: ""
      }
    },
    defaultVariants: {
      variant: "default",
      interactive: false
    },
  }
)

export interface TagProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof tagVariants> {
  dismissible?: boolean
  onDismiss?: () => void
  icon?: React.ReactNode
}

export function Tag({ 
  className, 
  variant, 
  interactive,
  dismissible = false,
  onDismiss,
  icon,
  children, 
  ...props 
}: TagProps) {
  return (
    <div 
      className={cn(tagVariants({ variant, interactive }), className)} 
      {...props}
    >
      {icon && <span className="mr-1">{icon}</span>}
      {children}
      {dismissible && (
        <button
          type="button"
          onClick={onDismiss}
          className="ml-1 -mr-1 h-3.5 w-3.5 rounded-full hover:bg-background/25 inline-flex items-center justify-center"
          aria-label="Remove tag"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  )
} 