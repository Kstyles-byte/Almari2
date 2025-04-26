import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../../lib/utils"

const emptyStateVariants = cva(
  "flex flex-col items-center justify-center rounded-lg border bg-muted/50 p-8 text-center",
  {
    variants: {
      size: {
        default: "py-10",
        sm: "py-8",
        lg: "py-16",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
)

export interface EmptyStateProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof emptyStateVariants> {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
}

export function EmptyState({
  className,
  size,
  icon,
  title,
  description,
  action,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(emptyStateVariants({ size, className }))}
      {...props}
    >
      {icon && (
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
          {icon}
        </div>
      )}
      <h3 className="mb-2 text-xl font-semibold">{title}</h3>
      {description && (
        <p className="mb-6 max-w-sm text-muted-foreground">{description}</p>
      )}
      {action && <div className="flex justify-center">{action}</div>}
    </div>
  )
} 