'use client';

import React, { Suspense } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Button } from '../ui/button';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "../ui/pagination"; // Assuming shadcn/ui pagination
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
}

// Inner component that uses the hook
function PaginationControlsContent({ currentPage, totalPages }: PaginationControlsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const createPageURL = (pageNumber: number | string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', pageNumber.toString());
    return `${pathname}?${params.toString()}`;
  };

  if (totalPages <= 1) {
    return null; // Don't render pagination if there's only one page
  }

  // Basic pagination logic (can be enhanced)
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5; // Adjust as needed
    
    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // Show first page
      pageNumbers.push(1);
      
      // Calculate start and end for middle range
      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);

      if (currentPage <= 3) {
        end = Math.min(totalPages - 1, 4); // Show 1, 2, 3, 4 ... last
      }
      if (currentPage >= totalPages - 2) {
        start = Math.max(2, totalPages - 3); // Show 1 ... last-3, last-2, last-1, last
      }

      // Ellipsis before middle range?
      if (start > 2) {
        pageNumbers.push('...');
      }

      // Middle range
      for (let i = start; i <= end; i++) {
        pageNumbers.push(i);
      }

      // Ellipsis after middle range?
      if (end < totalPages - 1) {
        pageNumbers.push('...');
      }
      
      // Show last page
      pageNumbers.push(totalPages);
    }
    return pageNumbers;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="mt-8 flex justify-center">
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious 
              href={createPageURL(currentPage - 1)}
              aria-disabled={currentPage <= 1}
              tabIndex={currentPage <= 1 ? -1 : undefined}
              className={currentPage <= 1 ? "pointer-events-none opacity-50" : undefined}
            />
          </PaginationItem>
          
          {pageNumbers.map((page, index) => (
            <PaginationItem key={index}>
              {page === '...' ? (
                <PaginationEllipsis />
              ) : (
                <PaginationLink 
                  href={createPageURL(page as number)}
                  isActive={currentPage === page}
                >
                  {page}
                </PaginationLink>
              )}
            </PaginationItem>
          ))}
          
          <PaginationItem>
            <PaginationNext 
              href={createPageURL(currentPage + 1)}
              aria-disabled={currentPage >= totalPages}
              tabIndex={currentPage >= totalPages ? -1 : undefined}
              className={currentPage >= totalPages ? "pointer-events-none opacity-50" : undefined}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}

// Export the wrapper component with Suspense
export function PaginationControls(props: PaginationControlsProps) {
  const { totalPages } = props;
  
  // Don't render anything if there's only one page
  if (totalPages <= 1) {
    return null;
  }
  
  return (
    <Suspense fallback={<div className="mt-8 h-10 w-full max-w-[400px] mx-auto bg-gray-100 animate-pulse rounded-md"></div>}>
      <PaginationControlsContent {...props} />
    </Suspense>
  );
} 