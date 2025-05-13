"use client";

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { submitReview } from '@/actions/reviews';
import { ReviewForm } from '../customer/review-form';
import { Button } from '../ui/button';
import { Loader2 } from 'lucide-react';

interface ProductReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  productName: string;
}

export function ProductReviewModal({ isOpen, onClose, productId, productName }: ProductReviewModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (reviewData: { rating: number; comment: string }) => {
    try {
      setIsSubmitting(true);
      console.log("Starting review submission in modal for product:", productId);
      console.log("Review data:", reviewData);
      
      // Create a FormData object for the server action
      const formData = new FormData();
      formData.append('productId', productId);
      formData.append('rating', reviewData.rating.toString());
      formData.append('comment', reviewData.comment);
      
      console.log("Form data prepared, calling submitReview action");
      // Call the server action
      const result = await submitReview(formData);
      console.log("Received result from submitReview action:", result);
      
      if (result.error) {
        console.error("Error from submitReview action:", result.error);
        toast.error(result.error);
      } else {
        console.log("Review submitted successfully with ID:", result.reviewId);
        toast.success('Review submitted successfully!');
        // Close the modal
        onClose();
        // Reload the page to show the new review (revalidation should handle this, but just to be sure)
        window.location.reload();
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        toast.error(`Error submitting review: ${error.message}`);
      } else {
        toast.error('An unexpected error occurred while submitting your review.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Write a Review for {productName}</DialogTitle>
        </DialogHeader>
        
        {isSubmitting ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-8 w-8 text-zervia-600 animate-spin mb-4" />
            <p className="text-zervia-600">Submitting your review...</p>
          </div>
        ) : (
          <ReviewForm 
            isEditing={false}
            onSubmit={handleSubmit}
            onCancel={onClose}
          />
        )}
      </DialogContent>
    </Dialog>
  );
} 