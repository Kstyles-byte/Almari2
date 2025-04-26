'use client';

import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Review, ReviewCard } from "@/components/customer/review-card";
import { ReviewForm } from "@/components/customer/review-form";
import { MessageSquare, Filter } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Mock reviews data
const mockReviewsData: Review[] = [
  {
    id: "1",
    productId: "prod-1",
    productName: "Premium Cotton T-Shirt",
    productImage: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=300&h=300&fit=crop",
    productSlug: "premium-cotton-tshirt",
    rating: 4,
    comment: "Great quality t-shirt! The material is soft and comfortable. The fit is perfect and hasn't shrunk after washing. Would definitely recommend.",
    createdAt: "2023-04-15T10:30:00Z",
    status: 'published'
  },
  {
    id: "2",
    productId: "prod-2",
    productName: "Classic Denim Jacket",
    productImage: "https://images.unsplash.com/photo-1598554747436-c9293d6a588f?w=300&h=300&fit=crop",
    productSlug: "classic-denim-jacket",
    rating: 5,
    comment: "Amazing jacket! The denim is sturdy but not too stiff. I've gotten many compliments on it. True to size and the color is exactly as pictured.",
    createdAt: "2023-04-10T14:45:00Z",
    status: 'published'
  },
  {
    id: "3",
    productId: "prod-3",
    productName: "Vintage Leather Backpack",
    productImage: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=300&h=300&fit=crop",
    productSlug: "vintage-leather-backpack",
    rating: 3,
    comment: "The backpack looks good but the quality isn't what I expected for the price. The stitching is coming loose in a few places after just a week of use.",
    createdAt: "2023-04-05T09:15:00Z",
    status: 'pending'
  }
];

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>(mockReviewsData);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [reviewToEdit, setReviewToEdit] = useState<Review | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [activeTab, setActiveTab] = useState('all');

  const filteredReviews = reviews.filter(review => {
    if (activeTab === 'all') return true;
    if (activeTab === 'published') return review.status === 'published';
    if (activeTab === 'pending') return review.status === 'pending';
    return true;
  });

  const handleEditReview = (reviewData: { rating: number; comment: string }) => {
    if (!reviewToEdit) return;
    
    const updatedReviews = reviews.map(review => {
      if (review.id === reviewToEdit.id) {
        return { 
          ...review, 
          rating: reviewData.rating,
          comment: reviewData.comment,
          updatedAt: new Date().toISOString(),
          status: 'pending' as const // Explicitly typed as const to match Review type
        };
      }
      return review;
    });
    
    setReviews(updatedReviews);
    setIsEditDialogOpen(false);
    setReviewToEdit(null);
    showNotification('success', 'Review updated successfully');
  };

  const handleDeleteReview = (id: string) => {
    const filteredReviews = reviews.filter(review => review.id !== id);
    setReviews(filteredReviews);
    showNotification('success', 'Review deleted successfully');
  };
  
  const handleEditButtonClick = (id: string) => {
    const review = reviews.find(review => review.id === id);
    if (review) {
      setReviewToEdit(review);
      setIsEditDialogOpen(true);
    }
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">My Reviews</h1>
          <p className="text-zervia-500">{reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}</p>
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div 
          className={`p-3 rounded-md mb-4 ${
            notification.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}
        >
          {notification.message}
        </div>
      )}

      {/* Edit Review Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Edit Review</DialogTitle>
          </DialogHeader>
          {reviewToEdit && (
            <ReviewForm 
              review={reviewToEdit} 
              onSubmit={handleEditReview} 
              onCancel={() => setIsEditDialogOpen(false)} 
              isEditing={true}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Filter Tabs */}
      <Tabs defaultValue="all" className="mb-6" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All Reviews</TabsTrigger>
          <TabsTrigger value="published">Published</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
        </TabsList>
      </Tabs>

      {filteredReviews.length > 0 ? (
        <div className="space-y-4">
          {filteredReviews.map(review => (
            <ReviewCard
              key={review.id}
              review={review}
              onEdit={handleEditButtonClick}
              onDelete={handleDeleteReview}
            />
          ))}
        </div>
      ) : (
        <Card className="p-6">
          <EmptyState
            icon={<MessageSquare className="h-12 w-12 text-zervia-300" />}
            title="No reviews found"
            description={activeTab !== 'all' ? 
              `You don't have any ${activeTab} reviews yet.` : 
              "You haven't written any reviews yet. Share your experience with the products you've purchased!"
            }
            action={
              activeTab !== 'all' ? (
                <Button 
                  variant="outline"
                  onClick={() => setActiveTab('all')}
                >
                  View All Reviews
                </Button>
              ) : undefined
            }
          />
        </Card>
      )}
    </div>
  );
} 