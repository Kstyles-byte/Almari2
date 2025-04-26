import * as React from "react"
import { ChevronRight, MoreHorizontal } from "lucide-react"

import { cn } from "../../lib/utils"

interface BreadcrumbProps extends React.HTMLAttributes<HTMLElement> {
  separator?: React.ReactNode
  truncationLength?: number
  truncationPosition?: 'start' | 'middle' | 'end'
}

const Breadcrumb = React.forwardRef<HTMLElement, BreadcrumbProps>(
  ({ 
    className, 
    separator = <ChevronRight className="h-4 w-4" />, 
    truncationLength = 3,
    truncationPosition = 'middle',
    ...props 
  }, ref) => {
    const childCount = React.Children.count(props.children)
    const hasTruncation = childCount > truncationLength

    let modifiedChildren = props.children
    
    if (hasTruncation) {
      const childrenArray = React.Children.toArray(props.children)
      
      if (truncationPosition === 'start') {
        // Show ellipsis at start
        modifiedChildren = [
          <Breadcrumb.Ellipsis key="ellipsis" />,
          ...childrenArray.slice(-truncationLength)
        ]
      } else if (truncationPosition === 'end') {
        // Show ellipsis at end
        modifiedChildren = [
          ...childrenArray.slice(0, truncationLength),
          <Breadcrumb.Ellipsis key="ellipsis" />
        ]
      } else {
        // Show ellipsis in middle (default)
        const startSlice = Math.ceil(truncationLength / 2)
        const endSlice = truncationLength - startSlice
        
        modifiedChildren = [
          ...childrenArray.slice(0, startSlice),
          <Breadcrumb.Ellipsis key="ellipsis" />,
          ...childrenArray.slice(-endSlice)
        ]
      }
    }

    return (
      <nav
        ref={ref}
        aria-label="breadcrumb"
        className={cn(
          "flex flex-wrap items-center gap-1.5 break-words text-sm text-muted-foreground",
          className
        )}
        {...props}
      >
        <ol className="flex flex-wrap items-center gap-1.5">
          {React.Children.map(modifiedChildren, (child, index) => {
            if (!React.isValidElement(child)) {
              return child
            }

            // Don't add separator after the last item or after ellipsis
            const isLastItem = index === React.Children.count(modifiedChildren) - 1
            const isEllipsis = child.type === Breadcrumb.Ellipsis
            
            return (
              <li className="inline-flex items-center gap-1.5">
                {child}
                {!isLastItem && !isEllipsis && (
                  <span
                    role="presentation"
                    aria-hidden="true" 
                    className="text-muted-foreground/40"
                  >
                    {separator}
                  </span>
                )}
              </li>
            )
          })}
        </ol>
      </nav>
    )
  }
)
Breadcrumb.displayName = "Breadcrumb"

interface BreadcrumbItemProps extends React.HTMLAttributes<HTMLSpanElement> {
  href?: string
  active?: boolean
}

const BreadcrumbItem = React.forwardRef<HTMLSpanElement, BreadcrumbItemProps>(
  ({ className, href, active, children, ...props }, ref) => {
    const Component = href ? 'a' : 'span'
    
    return (
      <Component
        ref={ref}
        href={href}
        className={cn(
          "transition-colors hover:text-foreground",
          active && "font-medium text-foreground pointer-events-none",
          className
        )}
        aria-current={active ? "page" : undefined}
        {...props}
      >
        {children}
      </Component>
    )
  }
)
BreadcrumbItem.displayName = "BreadcrumbItem"

const BreadcrumbEllipsis = React.forwardRef<
  HTMLSpanElement, 
  React.HTMLAttributes<HTMLSpanElement>
>(({ className, ...props }, ref) => (
  <span
    ref={ref}
    role="presentation"
    aria-hidden="true"
    className={cn("flex h-9 w-9 items-center justify-center", className)}
    {...props}
  >
    <MoreHorizontal className="h-4 w-4" />
    <span className="sr-only">More</span>
  </span>
))
BreadcrumbEllipsis.displayName = "BreadcrumbEllipsis"

Breadcrumb.Item = BreadcrumbItem
Breadcrumb.Ellipsis = BreadcrumbEllipsis

export { Breadcrumb } 