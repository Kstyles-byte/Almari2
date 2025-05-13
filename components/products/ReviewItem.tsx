"use client";

import Image from 'next/image';
import { Star } from 'lucide-react';

// Define the shape of the review prop
interface Review {
  id: string;
  avatar?: string | null;
  user: string;
  rating: number;
  date: string | Date;
  comment?: string | null;
}

interface ReviewItemProps {
  review: Review;
}

export function ReviewItem({ review }: ReviewItemProps) {
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    (e.target as HTMLImageElement).src = '/images/avatars/default-avatar.svg';
  };

  return (
    <div className="border-b border-gray-200 pb-6 last:border-0">
      <div className="flex items-center mb-4">
        <div className="relative h-10 w-10 rounded-full overflow-hidden mr-3 bg-gray-100">
          <Image
            src={review.avatar || '/images/avatars/default-avatar.svg'}
            alt={review.user || "User avatar"}
            fill
            className="object-cover"
            onError={handleImageError} // Use the local handler
          />
        </div>
        <div>
          <h4 className="font-medium text-zervia-900">{review.user}</h4>
          <div className="flex items-center">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={14}
                  className={i < review.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}
                />
              ))}
            </div>
            <span className="ml-2 text-xs text-zervia-500">
              {new Date(review.date).toLocaleDateString('en-US', {
                year: 'numeric', month: 'short', day: 'numeric'
              })}
            </span>
          </div>
        </div>
      </div>
      {review.comment && <p className="text-zervia-700">{review.comment}</p>}
    </div>
  );
} 