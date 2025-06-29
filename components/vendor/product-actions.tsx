'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Edit, Eye, MoreVertical, Trash2, ToggleLeft, ToggleRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { toggleProductPublishStatus } from '@/actions/vendor-products';
import DeleteProductDialog from './delete-product-dialog';

interface ProductActionsProps {
  productId: string;
  productName: string;
  productSlug: string;
  isPublished: boolean;
}

export default function ProductActions({
  productId,
  productName,
  productSlug,
  isPublished,
}: ProductActionsProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);
  const [currentPublishStatus, setCurrentPublishStatus] = useState(isPublished);

  const toggleDropdown = () => {
    setShowDropdown(prev => !prev);
  };

  const closeDropdown = () => {
    setShowDropdown(false);
  };

  const handleTogglePublishStatus = async () => {
    try {
      setIsTogglingStatus(true);
      
      // Call the server action directly
      const result = await toggleProductPublishStatus(productId, currentPublishStatus);
      
      if (result.success && result.newStatus !== undefined) {
        setCurrentPublishStatus(result.newStatus);
        toast.success(`Product ${result.newStatus ? 'published' : 'unpublished'} successfully`);
      } else {
        console.error('Toggle status error:', result.error);
        
        // Show a more user-friendly error message
        if (result.error?.includes('Unauthorized') || result.error?.includes('session')) {
          toast.error('Please refresh the page and try again');
        } else {
          toast.error('Failed to update product status');
        }
      }
    } catch (error) {
      console.error('Error toggling product status:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsTogglingStatus(false);
      closeDropdown();
    }
  };

  return (
    <div className="relative">
      <button
        onClick={toggleDropdown}
        className="text-gray-500 hover:text-gray-700 focus:outline-none"
      >
        <MoreVertical size={18} />
      </button>

      {showDropdown && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={closeDropdown}
          />
          
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-md overflow-hidden shadow-lg z-20">
            <div className="py-1">
              <Link
                href={`/vendor/products/${productId}/edit`}
                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                onClick={closeDropdown}
                prefetch={true}
              >
                <Edit size={16} className="mr-2 text-gray-500" />
                Edit
              </Link>
              
              <Link
                href={`/product/${productSlug}`}
                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                onClick={closeDropdown}
                target="_blank"
              >
                <Eye size={16} className="mr-2 text-gray-500" />
                View
              </Link>
              
              <button
                onClick={handleTogglePublishStatus}
                disabled={isTogglingStatus}
                className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
              >
                {isTogglingStatus ? (
                  <>
                    <Loader2 size={16} className="mr-2 animate-spin" />
                    {currentPublishStatus ? 'Unpublishing...' : 'Publishing...'}
                  </>
                ) : currentPublishStatus ? (
                  <>
                    <ToggleLeft size={16} className="mr-2 text-gray-500" />
                    Unpublish
                  </>
                ) : (
                  <>
                    <ToggleRight size={16} className="mr-2 text-green-500" />
                    Publish
                  </>
                )}
              </button>
              
              <button
                onClick={() => {
                  setShowDeleteDialog(true);
                  closeDropdown();
                }}
                className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
              >
                <Trash2 size={16} className="mr-2" />
                Delete
              </button>
            </div>
          </div>
        </>
      )}

      <DeleteProductDialog
        productId={productId}
        productName={productName}
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
      />
    </div>
  );
} 