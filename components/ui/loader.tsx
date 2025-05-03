'use client';

import { cn } from "../../lib/utils"
import { Icons } from "../icons"

interface LoaderProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'xs' | 'sm' | 'md' | 'lg'
  variant?: 'default' | 'primary' | 'secondary'
  showText?: boolean
  text?: string
}

export function Loader({ 
  size = 'md', 
  variant = 'primary',
  showText = false,
  text = "Loading",
  className, 
  ...props 
}: LoaderProps) {
  const sizeClasses = {
    'xs': {
      container: 'h-4 w-4',
      outer: 'h-4 w-4 border-2',
      inner: 'h-4 w-4 border-2',
      icon: 8
    },
    'sm': {
      container: 'h-6 w-6',
      outer: 'h-6 w-6 border-2',
      inner: 'h-6 w-6 border-2',
      icon: 12
    },
    'md': {
      container: 'h-10 w-10',
      outer: 'h-10 w-10 border-3',
      inner: 'h-10 w-10 border-3',
      icon: 16
    },
    'lg': {
      container: 'h-20 w-20',
      outer: 'h-20 w-20 border-4',
      inner: 'h-20 w-20 border-4',
      icon: 24
    }
  };

  const variantClasses = {
    'default': {
      outer: 'border-gray-200',
      inner: 'border-transparent border-t-gray-500',
    },
    'primary': {
      outer: 'border-zervia-200',
      inner: 'border-transparent border-t-zervia-500',
    },
    'secondary': {
      outer: 'border-zervia-100',
      inner: 'border-transparent border-t-zervia-900',
    }
  };

  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn(
        "relative inline-flex flex-col items-center justify-center",
        className
      )}
      {...props}
    >
      <div className="relative">
        {/* Outer circle */}
        <div className={cn(
          "rounded-full",
          sizeClasses[size].outer,
          variantClasses[variant].outer
        )}></div>
        
        {/* Inner rotating element with custom animation */}
        <div className="absolute top-0 left-0">
          <style jsx>{`
            @keyframes custom-preloader {
              0% {
                transform: rotate(0deg) scale(1);
              }
              25% {
                transform: rotate(90deg) scale(1.1);
              }
              50% {
                transform: rotate(180deg) scale(1);
              }
              75% {
                transform: rotate(270deg) scale(1.1);
              }
              100% {
                transform: rotate(360deg) scale(1);
              }
            }
            .custom-preloader {
              animation: custom-preloader 1.5s infinite ease-in-out;
            }
          `}</style>
          <div className={cn(
            "custom-preloader rounded-full",
            sizeClasses[size].inner,
            variantClasses[variant].inner
          )}></div>
        </div>
        
        {/* Logo in center - only for md and lg sizes */}
        {(size === 'md' || size === 'lg') && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-zervia-500">
            <Icons.logo width={sizeClasses[size].icon} height={sizeClasses[size].icon} />
          </div>
        )}
      </div>

      {/* Text below - optional */}
      {showText && (
        <p className="mt-3 text-zervia-600 font-medium tracking-wider animate-pulse-gentle text-sm">
          {text}
        </p>
      )}
      
      <span className="sr-only">Loading...</span>
    </div>
  )
}

// Full Page Loader for page transitions
export function PageTransitionLoader({ text = "Loading" }: { text?: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zervia-50 transition-opacity duration-500">
      <Loader size="lg" variant="primary" showText text={text} />
    </div>
  )
}

// Button Loader with customizable text
export function ButtonLoader({ text = "Loading", className }: { text?: string, className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Loader size="xs" variant="primary" />
      <span>{text}</span>
    </div>
  )
}

// Action Loader - Used for specific actions like "Adding to Cart"
export function ActionLoader({ text, className }: { text: string, className?: string }) {
  return (
    <div className={cn(
      "fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity duration-300",
      className
    )}>
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full flex flex-col items-center">
        <Loader size="md" variant="primary" />
        <p className="mt-4 text-zervia-800 font-medium text-center">{text}</p>
      </div>
    </div>
  )
}