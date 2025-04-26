"use client"

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Star } from 'lucide-react';
import { Review } from './review-card';

interface ReviewFormProps {
  review?: Review;
  onSubmit: (reviewData: { rating: number; comment: string }) => void;
  onCancel: () => void;
  isEditing: boolean;
}

export function ReviewForm({ review, onSubmit, onCancel, isEditing }: ReviewFormProps) {
  const [rating, setRating] = useState(review?.rating || 0);
  const [comment, setComment] = useState(review?.comment || '');
  const [hoverRating, setHoverRating] = useState(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ rating, comment });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Product info if editing */}
      {isEditing && review && (
        <div className="flex items-center py-2 px-3 bg-zervia-50 rounded-md">
          <div className="flex-1">
            <h3 className="font-medium text-sm">{review.productName}</h3>
          </div>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium
            ${review.status === 'published' ? 'bg-green-100 text-green-800' : 
              review.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
              'bg-red-100 text-red-800'}`}
          >
            {review.status.charAt(0).toUpperCase() + review.status.slice(1)}
          </span>
        </div>
      )}

      {/* Star Rating */}
      <div className="space-y-2">
        <Label htmlFor="rating">Rating</Label>
        <div className="flex items-center" id="rating">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              className="focus:outline-none"
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              onClick={() => setRating(star)}
            >
              <Star
                className={`h-6 w-6 ${
                  star <= (hoverRating || rating)
                    ? "text-yellow-400 fill-yellow-400"
                    : "text-gray-300"
                }`}
              />
            </button>
          ))}
          <span className="ml-2 text-sm text-zervia-600">
            {rating > 0 ? `${rating} star${rating > 1 ? 's' : ''}` : 'Select a rating'}
          </span>
        </div>
      </div>

      {/* Review Text */}
      <div className="space-y-2">
        <Label htmlFor="comment">Your Review</Label>
        <Textarea
          id="comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your experience with this product..."
          rows={5}
          required
        />
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-3 mt-6">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          className="bg-zervia-600 hover:bg-zervia-700"
          disabled={rating === 0 || comment.trim() === ''}
        >
          {isEditing ? 'Update Review' : 'Submit Review'}
        </Button>
      </div>
    </form>
  );
} 