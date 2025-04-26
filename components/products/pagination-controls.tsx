import React from 'react';
import { Button } from '../ui/button';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function PaginationControls({ currentPage, totalPages, onPageChange }: PaginationControlsProps) {
  // No pagination needed if only one page
  if (totalPages <= 1) {
    return null;
  }

  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  // Create page buttons logic
  const renderPageButtons = () => {
    const pageButtons = [];
    
    // Always show first page
    pageButtons.push(
      <Button
        key="page-1"
        variant={currentPage === 1 ? "default" : "outline"}
        size="sm"
        onClick={() => onPageChange(1)}
        className={currentPage === 1 ? 'bg-zervia-600 hover:bg-zervia-700' : ''}
      >
        1
      </Button>
    );

    // Logic for displaying page numbers with ellipsis
    if (totalPages > 5) {
      if (currentPage > 3) {
        pageButtons.push(
          <Button key="ellipsis-1" variant="ghost" size="sm" disabled>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        );
      }

      // Show current page and neighbors
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
        if (i > 1 && i < totalPages) {
          pageButtons.push(
            <Button
              key={`page-${i}`}
              variant={currentPage === i ? "default" : "outline"}
              size="sm"
              onClick={() => onPageChange(i)}
              className={currentPage === i ? 'bg-zervia-600 hover:bg-zervia-700' : ''}
            >
              {i}
            </Button>
          );
        }
      }

      if (currentPage < totalPages - 2) {
        pageButtons.push(
          <Button key="ellipsis-2" variant="ghost" size="sm" disabled>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        );
      }
    } else {
      // Less than 6 pages, show all page numbers
      for (let i = 2; i < totalPages; i++) {
        pageButtons.push(
          <Button
            key={`page-${i}`}
            variant={currentPage === i ? "default" : "outline"}
            size="sm"
            onClick={() => onPageChange(i)}
            className={currentPage === i ? 'bg-zervia-600 hover:bg-zervia-700' : ''}
          >
            {i}
          </Button>
        );
      }
    }

    // Always show last page
    if (totalPages > 1) {
      pageButtons.push(
        <Button
          key={`page-${totalPages}`}
          variant={currentPage === totalPages ? "default" : "outline"}
          size="sm"
          onClick={() => onPageChange(totalPages)}
          className={currentPage === totalPages ? 'bg-zervia-600 hover:bg-zervia-700' : ''}
        >
          {totalPages}
        </Button>
      );
    }

    return pageButtons;
  };

  return (
    <div className="flex flex-col items-center mt-8 space-y-2 sm:space-y-0 sm:flex-row sm:justify-between">
      <div className="text-sm text-zervia-600">
        Showing page {currentPage} of {totalPages}
      </div>
      
      <div className="flex items-center space-x-2">
        {/* Previous button */}
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrevious}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Prev
        </Button>

        {/* Page numbers */}
        <div className="hidden md:flex space-x-2">
          {renderPageButtons()}
        </div>

        {/* Current page indicator for mobile */}
        <div className="md:hidden flex items-center">
          <span className="text-sm">{currentPage} / {totalPages}</span>
        </div>

        {/* Next button */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleNext}
          disabled={currentPage === totalPages}
        >
          Next
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
} 