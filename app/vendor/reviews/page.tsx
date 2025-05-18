import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import Link from 'next/link';
import Image from 'next/image';
import { Star, StarHalf, Filter, ChevronDown, Search, MessageSquare } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function VendorReviewsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          cookieStore.set({ name, value: '', ...options });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return <div>Loading...</div>;
  }

  // Get vendor ID
  const { data: vendorData, error: vendorError } = await supabase
    .from('Vendor')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (vendorError || !vendorData) {
    return <div>Error loading vendor data</div>;
  }

  // Fetch product reviews for this vendor
  const { data: reviewsData, error: reviewsError } = await supabase
    .from('Review')
    .select(`
      id,
      rating,
      content,
      created_at,
      vendor_response,
      User:user_id(name, avatar_url),
      Product:product_id(
        id,
        name,
        slug,
        ProductImage(url)
      )
    `)
    .eq('vendor_id', vendorData.id)
    .order('created_at', { ascending: false });

  if (reviewsError) {
    console.error('Error fetching reviews:', reviewsError);
    return <div>Error loading reviews</div>;
  }

  // Calculate average rating
  const totalReviews = reviewsData.length;
  const sumRatings = reviewsData.reduce((sum, review) => sum + review.rating, 0);
  const averageRating = totalReviews > 0 ? sumRatings / totalReviews : 0;
  
  // Count reviews by rating
  const ratingCounts = [0, 0, 0, 0, 0]; // 1-5 stars
  reviewsData.forEach(review => {
    const index = Math.min(Math.max(Math.floor(review.rating) - 1, 0), 4);
    ratingCounts[index]++;
  });

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Render stars for a given rating
  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating - fullStars >= 0.5;
    
    // Add full stars
    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={`full-${i}`} className="w-4 h-4 text-yellow-400 fill-current" />);
    }
    
    // Add half star if needed
    if (hasHalfStar) {
      stars.push(<StarHalf key="half" className="w-4 h-4 text-yellow-400 fill-current" />);
    }
    
    // Add empty stars
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<Star key={`empty-${i}`} className="w-4 h-4 text-gray-300" />);
    }
    
    return stars;
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4 sm:mb-0">Reviews & Ratings</h1>
      </div>
      
      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search reviews..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-zervia-500 focus:border-zervia-500 text-sm"
            />
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative">
              <button className="flex items-center px-4 py-2 border border-gray-200 rounded-md text-sm bg-white hover:bg-gray-50">
                <Filter size={16} className="mr-2 text-gray-500" />
                Filter
                <ChevronDown size={16} className="ml-2 text-gray-500" />
              </button>
            </div>
            
            <div className="relative">
              <button className="flex items-center px-4 py-2 border border-gray-200 rounded-md text-sm bg-white hover:bg-gray-50">
                Sort by
                <ChevronDown size={16} className="ml-2 text-gray-500" />
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Rating Summary */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-900 mb-4">Rating Summary</h2>
          <div className="text-4xl font-bold text-gray-900 mb-2">{averageRating.toFixed(1)}</div>
          <div className="flex mb-4">
            {renderStars(averageRating)}
            <span className="ml-2 text-sm text-gray-500">{totalReviews} reviews</span>
          </div>
          
          {/* Rating Breakdown */}
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map(rating => {
              const count = ratingCounts[rating - 1];
              const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
              
              return (
                <div key={rating} className="flex items-center">
                  <div className="w-12 text-sm text-gray-600">{rating} Stars</div>
                  <div className="flex-1 ml-4">
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-yellow-400 rounded-full" 
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="w-9 text-right text-sm text-gray-600">{count}</div>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Response Rate */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-900 mb-4">Response Rate</h2>
          {/* Calculate response rate */}
          {(() => {
            const respondedReviews = reviewsData.filter(review => review.vendor_response).length;
            const responseRate = totalReviews > 0 ? (respondedReviews / totalReviews) * 100 : 0;
            
            return (
              <>
                <div className="text-4xl font-bold text-gray-900 mb-2">{Math.round(responseRate)}%</div>
                <div className="text-sm text-gray-500 mb-4">
                  You&apos;ve responded to {respondedReviews} of {totalReviews} reviews
                </div>
                
                <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-500 rounded-full" 
                    style={{ width: `${responseRate}%` }}
                  ></div>
                </div>
              </>
            );
          })()}
        </div>
        
        {/* Unresponded Reviews */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-900 mb-4">Unresponded Reviews</h2>
          {/* Calculate unresponded reviews */}
          {(() => {
            const unrespondedReviews = reviewsData.filter(review => !review.vendor_response).length;
            
            return (
              <>
                <div className="text-4xl font-bold text-gray-900 mb-2">{unrespondedReviews}</div>
                <div className="text-sm text-gray-500 mb-4">
                  {unrespondedReviews === 0 
                    ? 'Great job! You&apos;ve responded to all reviews.' 
                    : `You have ${unrespondedReviews} review(s) awaiting response`}
                </div>
                
                {unrespondedReviews > 0 && (
                  <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-zervia-600 hover:bg-zervia-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zervia-500">
                    <MessageSquare size={16} className="mr-2" />
                    Respond Now
                  </button>
                )}
              </>
            );
          })()}
        </div>
      </div>
      
      {/* Reviews List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">All Reviews</h2>
        </div>
        
        {reviewsData.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {reviewsData.map(review => (
              <div key={review.id} className="p-6">
                <div className="flex flex-col md:flex-row">
                  {/* Product Info */}
                  <div className="flex-shrink-0 mb-4 md:mb-0 md:mr-6">
                    <div className="flex items-center">
                      <div className="h-16 w-16 rounded-md overflow-hidden relative">
                        {review.Product?.[0]?.ProductImage && review.Product[0].ProductImage[0] ? (
                          <Image
                            src={review.Product[0].ProductImage[0].url}
                            alt={review.Product?.[0]?.name || ''}
                            fill
                            sizes="64px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="h-full w-full bg-gray-200 flex items-center justify-center">
                            <span className="text-xs text-gray-400">No image</span>
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <h3 className="text-sm font-medium text-gray-900">{review.Product?.[0]?.name}</h3>
                        <Link href={`/vendor/products/${review.Product?.[0]?.id}`} className="text-xs text-zervia-600 hover:text-zervia-700">
                          View Product
                        </Link>
                      </div>
                    </div>
                  </div>
                  
                  {/* Review Content */}
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <div className="flex">
                        {renderStars(review.rating)}
                      </div>
                      <span className="ml-2 text-sm text-gray-500">{formatDate(review.created_at)}</span>
                    </div>
                    
                    <div className="mb-4">
                      <div className="flex items-center mb-1">
                        <div className="h-6 w-6 rounded-full bg-gray-200 overflow-hidden relative mr-2">
                          {review.User?.[0]?.avatar_url ? (
                            <Image
                              src={review.User[0].avatar_url}
                              alt=""
                              fill
                              sizes="24px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="h-full w-full bg-gray-300 flex items-center justify-center">
                              <span className="text-xs text-gray-500">
                                {review.User?.[0]?.name?.charAt(0) || '?'}
                              </span>
                            </div>
                          )}
                        </div>
                        <span className="text-sm font-medium text-gray-900">{review.User?.[0]?.name || 'Anonymous'}</span>
                      </div>
                      <p className="text-sm text-gray-700">{review.content}</p>
                    </div>
                    
                    {/* Vendor Response */}
                    {review.vendor_response ? (
                      <div className="bg-gray-50 p-3 rounded-md">
                        <p className="text-xs font-medium text-gray-700 mb-1">Your Response:</p>
                        <p className="text-sm text-gray-700">{review.vendor_response}</p>
                      </div>
                    ) : (
                      <div>
                        <Link 
                          href={`/vendor/reviews/${review.id}/respond`}
                          className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm leading-4 font-medium rounded-md text-zervia-600 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zervia-500"
                        >
                          <MessageSquare size={14} className="mr-1" />
                          Reply to Review
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <div className="mx-auto h-12 w-12 text-gray-400">
              <MessageSquare className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No Reviews Yet</h3>
            <p className="mt-1 text-sm text-gray-500">
              You don&apos;t have any reviews for your products yet.
            </p>
          </div>
        )}
        
        {reviewsData.length > 0 && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {reviewsData.length} review(s)
              </div>
              
              <div className="flex-1 flex justify-end">
                <button disabled className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-400 bg-gray-100 cursor-not-allowed">
                  Previous
                </button>
                <button disabled className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-400 bg-gray-100 cursor-not-allowed">
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 