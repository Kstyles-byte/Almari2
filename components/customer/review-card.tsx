"use client"

import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit2, Trash2, Star } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

export interface Review {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  productSlug: string;
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt?: string;
}

interface ReviewCardProps {
  review: Review;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export function ReviewCard({ review, onEdit, onDelete }: ReviewCardProps) {
  return (
    <Card className="p-4 border border-gray-200 overflow-hidden">
      <div className="flex gap-4">
        {/* Product image */}
        <div className="relative w-20 h-20 flex-shrink-0">
          <Link href={`/product/${review.productSlug}`}>
            <Image
              src={review.productImage}
              alt={review.productName}
              fill
              className="object-cover rounded-md"
            />
          </Link>
        </div>
        
        {/* Review content */}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <div>
              <Link href={`/product/${review.productSlug}`}>
                <h3 className="font-medium text-zervia-900 hover:text-zervia-600 transition-colors">
                  {review.productName}
                </h3>
              </Link>
              
              <div className="flex items-center mt-1">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < review.rating
                          ? "text-yellow-400 fill-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs text-zervia-500 ml-2">
                  {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
                </span>
              </div>
            </div>
          </div>
          
          <p className="text-sm text-zervia-700 mt-2 line-clamp-2">{review.comment}</p>
          
          {/* Actions */}
          <div className="flex justify-end mt-3 space-x-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-zervia-600"
              onClick={() => onEdit(review.id)}
            >
              <Edit2 className="h-3.5 w-3.5 mr-1" />
              Edit
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-red-600"
              onClick={() => onDelete(review.id)}
            >
              <Trash2 className="h-3.5 w-3.5 mr-1" />
              Delete
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
} 