import * as React from "react"
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react"

import { cn } from "../../lib/utils"
import { Button } from "./button"

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  className,
}: PaginationProps) {
  // Generate page numbers to show (show 5 at most)
  const getPageNumbers = () => {
    const pageNumbers = [];
    
    if (totalPages <= 5) {
      // If we have 5 or fewer pages, show all
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // Always include first and last page
      pageNumbers.push(1);
      
      // Determine start and end of current window
      let startPage = Math.max(2, currentPage - 1);
      let endPage = Math.min(totalPages - 1, currentPage + 1);
      
      // Adjust window if we're near the start or end
      if (currentPage <= 3) {
        endPage = 4;
      } else if (currentPage >= totalPages - 2) {
        startPage = totalPages - 3;
      }
      
      // Add ellipsis before if needed
      if (startPage > 2) {
        pageNumbers.push(-1); // Use -1 to represent ellipsis
      }
      
      // Add window pages
      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }
      
      // Add ellipsis after if needed
      if (endPage < totalPages - 1) {
        pageNumbers.push(-2); // Use -2 to represent ellipsis
      }
      
      // Add last page if not already included
      if (endPage < totalPages) {
        pageNumbers.push(totalPages);
      }
    }
    
    return pageNumbers;
  };

  const canGoPrevious = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  return (
    <div className={cn("flex items-center justify-center space-x-2", className)}>
      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8"
        onClick={() => canGoPrevious && onPageChange(currentPage - 1)}
        disabled={!canGoPrevious}
        aria-label="Go to previous page"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      
      {getPageNumbers().map((pageNumber, i) => {
        if (pageNumber < 0) {
          // It's an ellipsis
          return (
            <div 
              key={`ellipsis-${pageNumber}`} 
              className="flex items-center justify-center h-8 w-8"
            >
              <MoreHorizontal className="h-4 w-4" />
            </div>
          );
        }
        
        const isCurrentPage = pageNumber === currentPage;
        
        return (
          <Button
            key={pageNumber}
            variant={isCurrentPage ? "default" : "outline"}
            size="icon"
            className="h-8 w-8"
            onClick={() => onPageChange(pageNumber)}
            disabled={isCurrentPage}
            aria-label={`Go to page ${pageNumber}`}
            aria-current={isCurrentPage ? "page" : undefined}
          >
            {pageNumber}
          </Button>
        );
      })}
      
      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8"
        onClick={() => canGoNext && onPageChange(currentPage + 1)}
        disabled={!canGoNext}
        aria-label="Go to next page"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

Pagination.displayName = "Pagination" 

// -----------------------------------------------------------------------------
// Added shadcn/ui compatible sub-components so that legacy imports like
// "PaginationContent", "PaginationItem", etc. resolve without changes.
// These are thin wrappers that output simple semantic elements.
// -----------------------------------------------------------------------------

interface PaginationLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  isActive?: boolean;
  children: React.ReactNode;
}

export const PaginationContent = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <nav className={cn("flex items-center gap-2", className)} aria-label="Pagination Navigation">
    {children}
  </nav>
);

export const PaginationItem = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={className}>{children}</div>
);

export const PaginationLink = ({ isActive, className, children, ...props }: PaginationLinkProps) => (
  <a
    {...props}
    className={cn(
      "inline-flex h-8 w-8 items-center justify-center rounded-md border text-sm font-medium transition-colors",
      isActive ? "bg-primary text-primary-foreground" : "hover:bg-accent hover:text-accent-foreground",
      className
    )}
    aria-current={isActive ? "page" : undefined}
  >
    {children}
  </a>
);

export const PaginationPrevious = ({ className, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
  <PaginationLink aria-label="Go to previous page" {...props} className={className}>
    <ChevronLeft className="h-4 w-4" />
  </PaginationLink>
);

export const PaginationNext = ({ className, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
  <PaginationLink aria-label="Go to next page" {...props} className={className}>
    <ChevronRight className="h-4 w-4" />
  </PaginationLink>
);

export const PaginationEllipsis = ({ className }: { className?: string }) => (
  <span className={cn("inline-flex h-8 w-8 items-center justify-center", className)}>
    <MoreHorizontal className="h-4 w-4" />
  </span>
); 