"use client"

import React, { useState } from 'react';
import { ReviewCard, Review } from './review-card';
import { ReviewForm } from './review-form';
import { DeleteReviewDialog } from './delete-review-dialog';
import { editReview, removeReview } from '@/actions/reviews';
import { toast } from 'sonner';
import { AlertCircle } from 'lucide-react';
import { 
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetClose
} from '@/components/ui/sheet';

interface CustomerReviewsListProps {
  initialReviews: Review[];
}

export default function CustomerReviewsList({ initialReviews }: CustomerReviewsListProps) {
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Handle edit button click on a review card
  const handleEditClick = (reviewId: string) => {
    const review = reviews.find(r => r.id === reviewId);
    if (review) {
      setSelectedReview(review);
      setIsEditSheetOpen(true);
    }
  };
  
  // Handle delete button click on a review card
  const handleDeleteClick = (reviewId: string) => {
    const review = reviews.find(r => r.id === reviewId);
    if (review) {
      setSelectedReview(review);
      setIsDeleteDialogOpen(true);
    }
  };
  
  // Handle review edit submission
  const handleReviewUpdate = async (data: { rating: number; comment: string }) => {
    if (!selectedReview) return;
    
    try {
      setIsSubmitting(true);
      
      const formData = new FormData();
      formData.append("reviewId", selectedReview.id);
      formData.append("rating", data.rating.toString());
      formData.append("comment", data.comment);
      
      const result = await editReview(formData);
      
      if (result.error) {
        toast.error(result.error);
      } else {
        // Update local state
        setReviews(prevReviews => prevReviews.map(review => 
          review.id === selectedReview.id 
            ? { ...review, rating: data.rating, comment: data.comment, updatedAt: new Date().toISOString() }
            : review
        ));
        
        toast.success("Review updated successfully");
        setIsEditSheetOpen(false);
      }
    } catch (error) {
      console.error("Error updating review:", error);
      toast.error("Failed to update review. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle review deletion confirmation
  const handleDeleteConfirm = async () => {
    if (!selectedReview) return;
    
    try {
      setIsSubmitting(true);
      
      const formData = new FormData();
      formData.append("reviewId", selectedReview.id);
      
      const result = await removeReview(formData);
      
      if (result.error) {
        toast.error(result.error);
      } else {
        // Update local state by removing the deleted review
        setReviews(prevReviews => prevReviews.filter(review => review.id !== selectedReview.id));
        
        toast.success("Review deleted successfully");
        setIsDeleteDialogOpen(false);
      }
    } catch (error) {
      console.error("Error deleting review:", error);
      toast.error("Failed to delete review. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <>
      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.length === 0 ? (
          <div className="p-4 rounded-md bg-yellow-50 border border-yellow-200 flex items-center">
            <AlertCircle className="h-5 w-5 text-yellow-400 mr-3" />
            <p className="text-sm text-yellow-700">You have no reviews to display.</p>
          </div>
        ) : (
          reviews.map(review => (
            <ReviewCard
              key={review.id}
              review={review}
              onEdit={handleEditClick}
              onDelete={handleDeleteClick}
            />
          ))
        )}
      </div>
      
      {/* Edit Review Sheet */}
      <Sheet open={isEditSheetOpen} onOpenChange={setIsEditSheetOpen}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Edit Your Review</SheetTitle>
            <SheetDescription>
              Update your review for this product. Your feedback helps other shoppers make better decisions.
            </SheetDescription>
          </SheetHeader>
          
          <div className="py-4">
            {selectedReview && (
              <ReviewForm
                review={selectedReview}
                onSubmit={handleReviewUpdate}
                onCancel={() => setIsEditSheetOpen(false)}
                isEditing={true}
              />
            )}
          </div>
        </SheetContent>
      </Sheet>
      
      {/* Delete Confirmation Dialog */}
      {selectedReview && (
        <DeleteReviewDialog
          isOpen={isDeleteDialogOpen}
          onClose={() => setIsDeleteDialogOpen(false)}
          onConfirm={handleDeleteConfirm}
          reviewId={selectedReview.id}
          productName={selectedReview.productName}
        />
      )}
    </>
  );
} 