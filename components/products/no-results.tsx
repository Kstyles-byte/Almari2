import React from 'react';
import { FileSearch, RefreshCw } from 'lucide-react';
import { Button } from '../ui/button';

interface NoResultsProps {
  resetFilters?: () => void;
  searchTerm?: string;
}

export function NoResults({ resetFilters, searchTerm }: NoResultsProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="bg-zervia-50 rounded-full p-6 mb-6">
        <FileSearch className="h-12 w-12 text-zervia-400" />
      </div>
      
      <h2 className="text-2xl font-semibold text-zervia-900 mb-2 text-center">No products found</h2>
      
      {searchTerm ? (
        <p className="text-zervia-600 mb-6 text-center max-w-md">
          We couldn't find any products matching <span className="font-medium">"{searchTerm}"</span>
        </p>
      ) : (
        <p className="text-zervia-600 mb-6 text-center max-w-md">
          We couldn't find any products matching your current filters
        </p>
      )}
      
      <div className="space-y-3">
        {resetFilters && (
          <Button onClick={resetFilters} variant="default" className="bg-zervia-600 hover:bg-zervia-700">
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset Filters
          </Button>
        )}
        
        <div className="text-sm text-zervia-600 text-center mt-6">
          <p>You might want to:</p>
          <ul className="list-disc list-inside mt-2 text-left">
            <li>Check for spelling errors</li>
            <li>Try more general keywords</li>
            <li>Try fewer keywords</li>
            <li>Remove some filters</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 