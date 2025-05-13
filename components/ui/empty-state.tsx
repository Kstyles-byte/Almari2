import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import Link from "next/link"
import { LucideIcon } from "lucide-react"
import { Icons } from "@/components/icons"
import { Button } from "@/components/ui/button"

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
  // Get the icon component
  const IconComponent = () => {
    const iconSize = 48
    
    switch (icon) {
      case "package":
        return <Icons.package className="h-12 w-12 text-muted-foreground/60" />
      case "package-x":
        return <Icons.packageX className="h-12 w-12 text-muted-foreground/60" />
      case "shopping-cart":
        return <Icons.shoppingCart className="h-12 w-12 text-muted-foreground/60" />
      case "heart":
        return <Icons.heart className="h-12 w-12 text-muted-foreground/60" />
      case "star":
        return <Icons.star className="h-12 w-12 text-muted-foreground/60" />
      case "alert-circle":
        return <Icons.alertCircle className="h-12 w-12 text-muted-foreground/60" />
      default:
        return <Icons.info className="h-12 w-12 text-muted-foreground/60" />
    }
  }

  return (
    <div
      className={cn(emptyStateVariants({ size, className }))}
      {...props}
    >
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
        <IconComponent />
      </div>
      <h3 className="mt-6 text-lg font-semibold">{title}</h3>
      {description && (
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      )}
      {action && (
        <Link href={action.href} className="mt-6">
          <Button>{action.label}</Button>
        </Link>
      )}
    </div>
  )
}

// For backwards compatibility
export default EmptyState 