import { cn } from "../../lib/utils"

interface LoaderProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'primary' | 'secondary'
}

export function Loader({ 
  size = 'md', 
  variant = 'default',
  className, 
  ...props 
}: LoaderProps) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn(
        "relative inline-flex items-center justify-center",
        {
          'h-4 w-4': size === 'sm',
          'h-8 w-8': size === 'md',
          'h-12 w-12': size === 'lg',
        },
        className
      )}
      {...props}
    >
      <div
        className={cn(
          "absolute animate-spin-slow rounded-full border-2 border-solid border-t-transparent",
          {
            'h-4 w-4': size === 'sm',
            'h-8 w-8': size === 'md',
            'h-12 w-12': size === 'lg',
            'border-muted': variant === 'default',
            'border-primary': variant === 'primary',
            'border-secondary': variant === 'secondary',
          }
        )}
      />
      <span className="sr-only">Loading...</span>
    </div>
  )
}

export function FullPageLoader() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <Loader size="lg" variant="primary" />
    </div>
  )
} 