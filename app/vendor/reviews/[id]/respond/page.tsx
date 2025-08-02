import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, Star, StarHalf } from 'lucide-react';
import { notFound } from 'next/navigation';
import ReviewResponseForm from '@/components/vendor/review-response-form';

export const dynamic = 'force-dynamic';

export default async function RespondToReviewPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { id } = params;
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

  // Fetch specific review
  const { data: review, error: reviewError } = await supabase
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
    .eq('id', id)
    .eq('vendor_id', vendorData.id)
    .single();

  if (reviewError || !review) {
    console.error('Error fetching review:', reviewError);
    return notFound();
  }

  // If review already has a response, redirect to the main reviews page
  if (review.vendor_response) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 text-center my-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">You have already responded to this review</h2>
        <p className="text-gray-600 mb-6">You can view all your reviews and responses on the reviews page.</p>
        <Link 
          href="/vendor/reviews" 
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-zervia-600 hover:bg-zervia-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zervia-500"
        >
          Back to Reviews
        </Link>
      </div>
    );
  }

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
      <div className="flex items-center mb-6">
        <Link 
          href="/vendor/reviews" 
          className="text-zervia-600 hover:text-zervia-700 flex items-center mr-4"
        >
          <ChevronLeft size={20} />
          <span>Back to Reviews</span>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Respond to Review</h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Review Card */}
        <div className="md:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Customer Review</h3>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <div className="flex items-center mb-1">
                  <div className="h-8 w-8 rounded-full bg-gray-200 overflow-hidden relative mr-2">
                    {review.User?.[0]?.avatar_url ? (
                      <Image
                        src={review.User[0].avatar_url}
                        alt=""
                        fill
                        sizes="32px"
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
                  <div>
                    <span className="text-sm font-medium text-gray-900">{review.User?.[0]?.name || 'Anonymous'}</span>
                    <div className="text-xs text-gray-500">{formatDate(review.created_at)}</div>
                  </div>
                </div>
              </div>
              
              <div className="flex mb-3">
                {renderStars(review.rating)}
              </div>
              
              <p className="text-sm text-gray-700 mb-4">{review.content}</p>
              
              <div className="mb-4">
                <h4 className="text-xs font-semibold text-gray-700 uppercase mb-2">Product</h4>
                <div className="flex items-center">
                  <div className="h-12 w-12 rounded-md overflow-hidden relative">
                    {review.Product?.[0]?.ProductImage?.[0]?.url ? (
                      <Image
                        src={review.Product[0].ProductImage[0].url}
                        alt={review.Product?.[0]?.name || ''}
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="h-full w-full bg-gray-200 flex items-center justify-center">
                        <span className="text-xs text-gray-400">No image</span>
                      </div>
                    )}
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">{review.Product?.[0]?.name}</p>
                    <Link href={`/vendor/products/${review.Product?.[0]?.id}`} className="text-xs text-zervia-600 hover:text-zervia-700">
                      View Product
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Response Form */}
        <div className="md:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Your Response</h3>
            </div>
            <div className="p-6">
              <ReviewResponseForm reviewId={id} />
              
              <div className="mt-6">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Tips for responding to reviews:</h4>
                <ul className="text-sm text-gray-600 space-y-1 list-disc pl-5">
                  <li>Thank the customer for their feedback, even if it&apos;s negative</li>
                  <li>Address their specific concerns and be professional</li>
                  <li>Provide solutions or explain what you&apos;ve learned from their feedback</li>
                  <li>Keep it concise and friendly</li>
                  <li>Avoid getting defensive or argumentative</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 