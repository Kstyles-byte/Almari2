"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { checkCanReviewProduct } from '@/actions/reviews';
import { ProductReviewModal } from './ProductReviewModal';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface WriteReviewButtonProps {
  productId: string;
  productName: string;
  className?: string;
  children?: React.ReactNode;
}

export function WriteReviewButton({ 
  productId, 
  productName, 
  className = "",
  children
}: WriteReviewButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const router = useRouter();

  const handleClick = async () => {
    try {
      setIsChecking(true);
      
      console.log("Checking if user can review product:", productId);
      // Check if user can review the product
      const { canReview, reason } = await checkCanReviewProduct(productId);
      console.log("Check result:", { canReview, reason });
      
      if (canReview) {
        // Show the review modal
        setIsModalOpen(true);
      } else {
        // Show appropriate message based on reason
        switch (reason) {
          case 'notLoggedIn':
            toast.error('Please log in to write a review.');
            // Redirect to login page with return URL
            router.push(`/login?returnUrl=${encodeURIComponent(window.location.pathname)}`);
            break;
          case 'notCustomer':
            toast.error('Only customers can write reviews.');
            break;
          case 'alreadyReviewed':
            toast.error('You have already reviewed this product.');
            // Could redirect to "My Reviews" page
            // router.push('/customer/reviews');
            break;
          case 'notPurchased':
            // This case should no longer occur since we've bypassed the purchase check
            // But keep it just in case something goes wrong
            toast.error('Unable to add review. Please try again.');
            break;
          case 'bypass':
            // If we're bypassing checks due to errors, just open the modal
            setIsModalOpen(true);
            break;
          default:
            console.error('Unknown reason for review denial:', reason);
            // Try to open the modal anyway
            setIsModalOpen(true);
        }
      }
    } catch (error) {
      console.error('Error checking if can review:', error);
      // If there's an error checking, let the user try to review anyway
      toast.error('There was an issue checking review eligibility. Proceeding anyway...');
      setIsModalOpen(true);
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <>
      <Button 
        onClick={handleClick}
        disabled={isChecking}
        className={className}
      >
        {isChecking ? 'Checking...' : children || 'Write a Review'}
      </Button>
      
      <ProductReviewModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        productId={productId}
        productName={productName}
      />
    </>
  );
} 