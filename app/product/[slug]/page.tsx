import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Star, Truck, ShoppingBag, ArrowLeft, Check, MapPin, Heart, Share2, ShoppingCart } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { ImageGallery } from '../../../components/ui/image-gallery';
import { getProductBySlug } from '../../../actions/products'; // Import the action
import { notFound } from 'next/navigation'; // Import notFound for handling missing products
import type { Metadata, ResolvingMetadata } from 'next';

// Dynamic Metadata Generation
export async function generateMetadata(
  { params }: { params: { slug: string } },
  parent: ResolvingMetadata
): Promise<Metadata> {
  const product = await getProductBySlug(params.slug);

  if (!product) {
    // Return default metadata or handle as needed if product not found early
    return {
      title: 'Product Not Found | Zervia',
      description: 'The product you are looking for does not exist.',
    };
  }

  // optionaly access and extend (rather than replace) parent metadata
  // const previousImages = (await parent).openGraph?.images || []

  return {
    title: `${product.name} | Zervia`,
    description: product.description || 'Shop high-quality products on Zervia.',
    openGraph: {
      title: `${product.name} | Zervia`,
      description: product.description || 'Shop high-quality products on Zervia.',
      images: product.images.length > 0 ? [{ url: product.images[0].url }] : [],
    },
  };
}

// Mock pickup locations (Keep for now until agent data is integrated)
const pickupLocations = [
  {
    id: 1,
    name: "Student Union Building",
    distance: "0.5 miles",
    availability: "In stock, ready for pickup tomorrow"
  },
  {
    id: 2,
    name: "Science Complex",
    distance: "0.8 miles",
    availability: "In stock, ready for pickup tomorrow"
  },
  {
    id: 3,
    name: "Residence Hall West",
    distance: "1.2 miles",
    availability: "Limited stock, ready for pickup in 2 days"
  }
];

// Make the component async to fetch data
export default async function ProductDetail({ params }: { params: { slug: string } }) {
  
  const product = await getProductBySlug(params.slug);

  // If product is not found, render the 404 page
  if (!product) {
    notFound();
  }
  
  // Extract reviews and related products for easier access
  const reviews = product.reviews || [];
  const relatedProducts = product.relatedProducts || [];

  return (
    <div className="bg-white">
      {/* Breadcrumb - Now using dynamic data */}
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center text-sm flex-wrap">
          <Link href="/" className="text-zervia-500 hover:text-zervia-600">Home</Link>
          <span className="mx-2">/</span>
          <Link href={`/products?category=${product.categorySlug}`} className="text-zervia-500 hover:text-zervia-600">
            {product.categoryName || 'Category'}
          </Link>
          {/* Add subcategory if available */}
          {/* Example: 
          {product.subcategorySlug && (
            <>
              <span className="mx-2">/</span>
              <Link href={`/products?category=${product.categorySlug}&subcategory=${product.subcategorySlug}`} className="text-zervia-500 hover:text-zervia-600">
                {product.subcategoryName || 'Subcategory'}
              </Link>
            </>
          )} 
          */}
          <span className="mx-2">/</span>
          <span className="text-zervia-900">{product.name}</span>
        </div>
      </div>

      {/* Product display */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product images - Use fetched images */}
          <div>
            <ImageGallery images={product.images.length > 0 ? product.images : [{ id: 'placeholder', url: '/placeholder-product.jpg', alt: 'Placeholder Image' }]} />
          </div>
          
          {/* Product info - Use fetched data */}
          <div className="space-y-6">
            {/* Brand and title */}
            <div>
              <Link href={`/vendor/${product.vendorId}`} className="text-zervia-500 text-sm font-medium">
                {product.vendorName || 'Unknown Vendor'}
              </Link>
              <h1 className="text-3xl font-bold text-zervia-900 mt-1">{product.name}</h1>
              
              {/* Rating - Use fetched rating and review count */}
              <div className="flex items-center mt-2">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i}
                      size={16}
                      className={i < Math.floor(product.rating) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}
                    />
                  ))}
                </div>
                <span className="ml-2 text-sm text-zervia-500">
                  {product.rating.toFixed(1)} ({product.reviewCount} reviews)
                </span>
              </div>
            </div>
            
            {/* Price - Use fetched price and comparePrice */}
            <div>
              {product.comparePrice && product.comparePrice > product.price ? (
                <div className="flex items-baseline">
                  <span className="text-2xl font-bold text-zervia-900">${product.price.toFixed(2)}</span>
                  <span className="ml-2 text-lg text-zervia-500 line-through">${product.comparePrice.toFixed(2)}</span>
                  <span className="ml-2 text-sm bg-red-100 text-red-600 px-2 py-0.5 rounded">
                    Save ${(product.comparePrice - product.price).toFixed(2)}
                  </span>
                </div>
              ) : (
                <span className="text-2xl font-bold text-zervia-900">${product.price.toFixed(2)}</span>
              )}
            </div>
            
            {/* Short description - Use fetched description */}
            <p className="text-zervia-700">{product.description || 'No description available.'}</p>
            
            {/* Color selection - Placeholder/Example - Requires Variant System */}
            {product.colors && product.colors.length > 0 && product.colors[0] !== 'Default' && (
              <div>
                <h3 className="text-sm font-medium text-zervia-900 mb-3">Color</h3>
                <div className="flex space-x-2">
                  {product.colors.map((color: string, index: number) => (
                    <button
                      key={index}
                      className={`w-8 h-8 rounded-full border-2 ${
                        index === 0 // TODO: Implement actual color selection state
                          ? "border-zervia-600"
                          : "border-transparent hover:border-zervia-400"
                      } focus:outline-none focus:ring-2 focus:ring-zervia-500`}
                      style={{ 
                         backgroundColor: color.toLowerCase() === "black" ? "#000000" : 
                         color.toLowerCase() === "camel" ? "#C19A6B" : 
                         color.toLowerCase() === "grey" ? "#808080" : 
                         color.toLowerCase() === "navy" ? "#000080" : 
                         color.toLowerCase() === "white" ? "#FFFFFF" : color // Fallback to color name if not predefined
                      }}
                      aria-label={`Select ${color} color`}
                    />
                  ))}
                </div>
                <p className="mt-2 text-sm text-zervia-700">
                  Selected: <span className="font-medium">{product.colors[0]}</span>
                </p>
              </div>
            )}
            
            {/* Size selection - Placeholder/Example - Requires Variant System */}
             {product.sizes && product.sizes.length > 0 && product.sizes[0] !== 'One Size' && (
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-zervia-900">Size</h3>
                  {/* TODO: Link to actual size guide if available */}
                  <button className="text-sm font-medium text-zervia-600 hover:text-zervia-800">
                    Size Guide
                  </button>
                </div>
                <div className="grid grid-cols-5 gap-2 mt-3">
                  {product.sizes.map((size: string, index: number) => (
                    <button
                      key={index}
                      className={`py-2 border rounded-md text-sm font-medium ${
                        index === 0 // TODO: Implement actual size selection state
                          ? "bg-zervia-600 border-zervia-600 text-white"
                          : "border-gray-300 text-zervia-700 hover:border-zervia-600"
                      } focus:outline-none focus:ring-2 focus:ring-zervia-500`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
             )}
            
            {/* Quantity and add to cart - TODO: Implement client-side state and cart action */}
            <div className="pt-4">
              <div className="flex space-x-4">
                 {/* Quantity Selector - Requires client-side state */}
                <div className="flex items-center border border-gray-300 rounded-md w-32">
                  {/* Placeholder buttons - functionality needs client component */}
                  <button 
                    className="w-10 h-10 flex items-center justify-center text-zervia-600 hover:bg-zervia-50 disabled:opacity-50"
                    aria-label="Decrease quantity"
                    // disabled={quantity <= 1} onClick={() => setQuantity(q => q - 1)}
                  >
                    -
                  </button>
                  <input
                    type="text"
                    className="w-full h-10 text-center border-0 focus:outline-none focus:ring-0"
                    value={1} // Placeholder - needs client state
                    readOnly
                  />
                   <button 
                    className="w-10 h-10 flex items-center justify-center text-zervia-600 hover:bg-zervia-50 disabled:opacity-50"
                    aria-label="Increase quantity"
                    // disabled={quantity >= product.inventory} onClick={() => setQuantity(q => q + 1)}
                  >
                    +
                  </button>
                </div>
                
                 {/* Add to Cart Button - Requires client component and action */}
                <Button size="lg" className="flex-1" disabled={product.inventory <= 0}>
                  <ShoppingCart className="mr-2 h-5 w-5" /> 
                  {product.inventory > 0 ? 'Add to Cart' : 'Out of Stock'}
                </Button>
                
                {/* Wishlist Button - Requires client component and action */}
                <Button variant="outline" size="icon" className="h-12 w-12">
                  <Heart className="h-5 w-5 text-zervia-600" />
                </Button>
                
                 {/* Share Button - Requires client component and potentially library */}
                <Button variant="outline" size="icon" className="h-12 w-12">
                  <Share2 className="h-5 w-5 text-zervia-600" />
                </Button>
              </div>
              {product.inventory <= 5 && product.inventory > 0 && (
                  <p className="text-sm text-red-600 mt-2">Only {product.inventory} left in stock!</p>
              )}
            </div>
            
            {/* Product details - Use fetched data */}
            <div className="pt-6 border-t border-gray-200">
              <div className="flex space-x-4 items-center text-sm flex-wrap">
                <div className={`flex items-center ${product.inventory > 0 ? 'text-zervia-600' : 'text-red-600'}`}>
                  <Check className="h-5 w-5 mr-1" />
                  <span>{product.inventory > 0 ? 'In Stock' : 'Out of Stock'}</span>
                </div>
                <div className="flex items-center text-zervia-600">
                  <Truck className="h-5 w-5 mr-1" />
                  <span>Campus Pickup</span>
                </div>
                {/* Pickup locations count - Keep mock for now */}
                <div className="flex items-center text-zervia-600">
                  <MapPin className="h-5 w-5 mr-1" />
                  <span>{pickupLocations.length} Pickup Locations</span>
                </div>
              </div>
            </div>
            
            {/* Pickup locations - Keep mock for now */}
            <div className="bg-zervia-50 p-4 rounded-lg space-y-3">
              <h3 className="font-medium text-zervia-900">Available Pickup Locations</h3>
              {pickupLocations.map((location) => (
                <div key={location.id} className="flex items-start py-2 border-b border-zervia-100 last:border-0">
                  <MapPin className="h-5 w-5 text-zervia-600 mt-0.5 flex-shrink-0" />
                  <div className="ml-2">
                    <h4 className="font-medium text-zervia-800">{location.name}</h4>
                    <p className="text-sm text-zervia-600">{location.distance} • {location.availability}</p>
                  </div>
                </div>
              ))}
               {/* TODO: Add link to view all locations or select preferred */}
            </div>
          </div>
        </div>
        
        {/* Product tabs: Description, Specs, Reviews - Use fetched data */}
        <div className="mt-16">
          <Tabs defaultValue="description">
            <TabsList className="border-b border-gray-200 w-full justify-start">
              <TabsTrigger value="description">Description</TabsTrigger>
              {/* Optionally show features tab if data exists */}
              {product.features && product.features.length > 0 && (
                <TabsTrigger value="features">Features & Specs</TabsTrigger>
              )}
              <TabsTrigger value="reviews">Reviews ({reviews.length})</TabsTrigger>
            </TabsList>
            
            {/* Description Tab */}
            <TabsContent value="description" className="pt-6">
              <div className="prose max-w-none text-zervia-700">
                {/* Render longDescription if available, otherwise fallback to description */}
                 <p className="mb-4">{product.longDescription || product.description || 'No detailed description provided.'}</p>
                 {/* Add more content as needed */} 
              </div>
            </TabsContent>
            
            {/* Features & Specs Tab - Use fetched features and details */}
            {product.features && product.features.length > 0 && (
              <TabsContent value="features" className="pt-6">
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-lg font-medium text-zervia-900 mb-4">Features</h3>
                    <ul className="space-y-2">
                      {product.features.map((feature: string, index: number) => (
                        <li key={index} className="flex items-start">
                          <Check className="h-5 w-5 text-zervia-600 mr-2 mt-0.5 flex-shrink-0" />
                          <span className="text-zervia-700">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium text-zervia-900 mb-4">Product Details</h3>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-4 text-sm border-b border-gray-200 pb-2">
                        <span className="text-zervia-500">Brand</span>
                        <span className="text-zervia-900">{product.vendorName || 'N/A'}</span>
                      </div>
                      {/* Example: Add Material if available in schema */}
                      {/* 
                      {product.material && (
                        <div className="grid grid-cols-2 gap-4 text-sm border-b border-gray-200 pb-2">
                          <span className="text-zervia-500">Material</span>
                          <span className="text-zervia-900">{product.material}</span>
                        </div>
                      )} 
                      */}
                      {product.sku && (
                        <div className="grid grid-cols-2 gap-4 text-sm border-b border-gray-200 pb-2">
                          <span className="text-zervia-500">SKU</span>
                          <span className="text-zervia-900">{product.sku}</span>
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-4 text-sm border-b border-gray-200 pb-2">
                        <span className="text-zervia-500">Category</span>
                        <span className="text-zervia-900">
                          <Link href={`/products?category=${product.categorySlug}`} className="text-zervia-600 hover:underline">
                            {product.categoryName || 'Uncategorized'}
                          </Link>
                          {/* Add Subcategory Link if available */}
                        </span>
                      </div>
                      {product.tags && product.tags.length > 0 && (
                        <div className="grid grid-cols-2 gap-4 text-sm border-b border-gray-200 pb-2">
                          <span className="text-zervia-500">Tags</span>
                          <span className="text-zervia-900">
                            {product.tags.map((tag: string, index: number) => (
                              <span key={index}>
                                {/* TODO: Link to tag search page if implemented */}
                                <Link href={`/products?tag=${tag}`} className="text-zervia-600 hover:underline">
                                  {tag}
                                </Link>
                                {index < product.tags.length - 1 ? ", " : ""}
                              </span>
                            ))}
                          </span>
                        </div>
                      )}
                       {/* Example: Add Care Instructions if available */}
                       {/*
                       {product.careInstructions && (
                         <div className="grid grid-cols-2 gap-4 text-sm">
                           <span className="text-zervia-500">Care</span>
                           <span className="text-zervia-900">{product.careInstructions}</span>
                         </div>
                       )}
                       */}
                    </div>
                  </div>
                </div>
              </TabsContent>
            )}
            
            {/* Reviews Tab - Use fetched reviews */}
            <TabsContent value="reviews" className="pt-6">
              {reviews.length > 0 ? (
                <div className="space-y-8">
                  {/* Review summary */}
                  <div className="flex flex-col md:flex-row gap-8 pb-8 border-b border-gray-200">
                    <div className="md:w-1/3">
                      <h3 className="text-2xl font-bold text-zervia-900">{product.rating.toFixed(1)} out of 5</h3>
                      <div className="flex mt-2">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i}
                            className={i < Math.floor(product.rating) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}
                          />
                        ))}
                      </div>
                      <p className="mt-1 text-sm text-zervia-600">Based on {product.reviewCount} reviews</p>
                      
                      {/* TODO: Implement Write Review button functionality */}
                      <Button className="mt-4">Write a Review</Button>
                    </div>
                    
                    <div className="md:w-2/3">
                      <h3 className="text-lg font-medium text-zervia-900 mb-4">Review Breakdown</h3>
                      {/* TODO: Implement dynamic review breakdown based on actual reviews */}
                       {[5, 4, 3, 2, 1].map((star) => {
                        // Calculate percentage for each star rating (requires aggregating review data)
                        const countForStar = reviews.filter(r => r.rating === star).length;
                        const percentage = reviews.length > 0 ? (countForStar / reviews.length) * 100 : 0;
                        return (
                          <div key={star} className="flex items-center mb-2">
                            <div className="w-8 text-sm text-zervia-700">{star} star</div>
                            <div className="w-full h-2 bg-gray-200 rounded-full mx-2">
                              <div 
                                className="h-2 bg-yellow-400 rounded-full" 
                                style={{ width: `${percentage}%` }} 
                              ></div>
                            </div>
                            <div className="w-10 text-sm text-zervia-600 text-right">
                              {Math.round(percentage)}%
                            </div>
                          </div>
                        );
                       })}
                    </div>
                  </div>
                  
                  {/* Individual reviews */}
                  <div className="space-y-6">
                    {reviews.map((review) => (
                      <div key={review.id} className="border-b border-gray-200 pb-6 last:border-0">
                        <div className="flex items-center mb-4">
                          <div className="relative h-10 w-10 rounded-full overflow-hidden mr-3 bg-gray-100">
                            <Image
                              src={review.avatar || '/images/avatars/default-avatar.png'} // Use default avatar
                              alt={review.user}
                              fill
                              className="object-cover"
                              onError={(e) => { (e.target as HTMLImageElement).src = '/images/avatars/default-avatar.png'; }} // Fallback on error
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
                              {/* Format Date */}
                              <span className="ml-2 text-xs text-zervia-500">
                                {new Date(review.date).toLocaleDateString('en-US', {
                                  year: 'numeric', month: 'short', day: 'numeric'
                                })}
                              </span>
                            </div>
                          </div>
                        </div>
                        <p className="text-zervia-700">{review.comment}</p>
                      </div>
                    ))}
                     {/* TODO: Add pagination for reviews if needed */} 
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-zervia-600">No reviews yet.</p>
                   {/* TODO: Implement Write Review button functionality */}
                  <Button className="mt-4">Be the first to write a review</Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
        
        {/* Related products - Use fetched related products */}
        {relatedProducts.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-zervia-900 mb-8">You May Also Like</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {relatedProducts.map((relatedProduct) => (
                <div key={relatedProduct.id} className="group">
                  <Link href={`/product/${relatedProduct.slug}`}>
                    <div className="relative h-64 rounded-lg overflow-hidden bg-zervia-50 mb-4">
                      <Image
                        src={relatedProduct.image || '/placeholder-product.jpg'}
                        alt={relatedProduct.name}
                        fill
                        className="object-cover transition-transform group-hover:scale-105"
                         onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder-product.jpg'; }}
                      />
                    </div>
                  </Link>
                  <Link href={`/product/${relatedProduct.slug}`} className="group">
                    <h3 className="font-medium text-zervia-900 group-hover:text-zervia-600 transition-colors truncate">
                      {relatedProduct.name}
                    </h3>
                  </Link>
                  <div className="flex items-center mt-1">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i}
                          size={12}
                          className={i < Math.floor(relatedProduct.rating) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}
                        />
                      ))}
                    </div>
                    <span className="ml-1 text-xs text-zervia-500">
                      ({relatedProduct.reviewCount})
                    </span>
                  </div>
                  <div className="mt-2 font-medium text-zervia-900">
                    {relatedProduct.comparePrice && relatedProduct.comparePrice > relatedProduct.price ? (
                        <div className="flex items-baseline gap-1">
                            <span className="text-zervia-900">${relatedProduct.price.toFixed(2)}</span>
                            <span className="text-sm text-zervia-500 line-through">${relatedProduct.comparePrice.toFixed(2)}</span>
                        </div>
                        ) : (
                            <span>${relatedProduct.price.toFixed(2)}</span>
                        )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}