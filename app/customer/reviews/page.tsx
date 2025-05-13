import React from 'react';
import CustomerReviewsList from '@/components/customer/customer-reviews-list';
import { PageWrapper } from '@/components/layout/page-wrapper';
import { getCustomerReviews } from '@/actions/reviews';

// Force dynamic behavior for this page to ensure fresh data
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'My Reviews | Zervia',
  description: 'Manage your product reviews',
};

export default async function CustomerReviewsPage() {
  // Fetch customer reviews
  const { success, reviews, error } = await getCustomerReviews();
  
  return (
    <PageWrapper>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-zervia-900 mb-6">My Reviews</h1>
        
        {error ? (
          <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg">
            {error}
          </div>
        ) : !success ? (
          <div className="p-4 mb-4 text-sm text-yellow-700 bg-yellow-100 rounded-lg">
            Loading your reviews...
          </div>
        ) : reviews && reviews.length > 0 ? (
          <CustomerReviewsList initialReviews={reviews} />
        ) : (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6">
              <h3 className="text-lg font-medium text-zervia-900 mb-2">
                You haven't submitted any reviews yet
              </h3>
              <p className="text-zervia-500 mb-6">
                After purchasing products, you can share your thoughts to help other shoppers make better decisions.
              </p>
              <a
                href="/customer/orders"
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-zervia-600 hover:bg-zervia-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zervia-500"
              >
                Go to My Orders
              </a>
            </div>
          </div>
        )}
      </div>
    </PageWrapper>
  );
} 