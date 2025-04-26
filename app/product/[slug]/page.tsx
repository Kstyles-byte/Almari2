import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Star, Truck, ShoppingBag, ArrowLeft, Check, MapPin, Heart, Share2, ShoppingCart } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { ImageGallery } from '../../../components/ui/image-gallery';

export const metadata = {
  title: 'Product Details | Zervia - Multi-vendor E-commerce Platform',
  description: 'Shop for high-quality products from trusted vendors with our agent-based delivery system.',
};

// Mock product data
const product = {
  id: 1,
  name: "Premium Wool Blend Oversized Coat",
  price: 189.99,
  salePrice: 149.99,
  description: "Experience luxury and warmth with our premium wool blend coat. Featuring an oversized fit, deep pockets, and a classic design that pairs perfectly with any outfit. Ideal for cold weather and designed to last for years.",
  longDescription: "This premium wool blend coat combines timeless style with exceptional craftsmanship. The oversized silhouette offers both comfort and a contemporary look, while the high-quality wool blend ensures warmth without excessive weight. Features include deep side pockets, interior pocket, a smooth satin lining, and durable buttons. The versatile design transitions seamlessly from office wear to evening outings. Available in multiple sophisticated colors, this coat is an investment piece that will elevate your wardrobe for years to come.",
  rating: 4.8,
  reviewCount: 124,
  images: [
    "/images/products/coat-1.jpg",
    "/images/products/coat-2.jpg",
    "/images/products/coat-3.jpg",
    "/images/products/coat-4.jpg"
  ],
  colors: ["Black", "Camel", "Grey", "Navy"],
  sizes: ["XS", "S", "M", "L", "XL"],
  inStock: true,
  sku: "COAT-WOOL-001",
  category: "women",
  subcategory: "outerwear",
  brand: "Emporium Elegance",
  tags: ["coat", "winter", "wool", "premium"],
  features: [
    "80% wool, 20% polyester blend",
    "Fully lined with satin",
    "Two deep side pockets",
    "One interior pocket",
    "Button closure",
    "Dry clean only"
  ],
  relatedProducts: [2, 3, 4, 5]
};

// Mock reviews
const reviews = [
  {
    id: 1,
    user: "Sarah M.",
    rating: 5,
    date: "2023-11-15",
    comment: "This coat exceeded my expectations! The quality is outstanding and it keeps me so warm. I've received many compliments on it already.",
    avatar: "/images/avatars/avatar-1.jpg"
  },
  {
    id: 2,
    user: "James L.",
    rating: 4,
    date: "2023-11-10",
    comment: "Great coat, very well made. Runs slightly large so I would recommend sizing down if you're between sizes.",
    avatar: "/images/avatars/avatar-2.jpg"
  },
  {
    id: 3,
    user: "Emily R.",
    rating: 5,
    date: "2023-10-28",
    comment: "Worth every penny! The fabric is luxurious and the cut is very flattering. Will be wearing this for many winters to come.",
    avatar: "/images/avatars/avatar-3.jpg"
  }
];

// Mock related products
const relatedProducts = [
  {
    id: 2,
    name: "Cashmere Blend Scarf",
    price: 49.99,
    image: "/images/products/scarf.jpg",
    slug: "cashmere-blend-scarf",
    rating: 4.9,
    reviewCount: 85
  },
  {
    id: 3,
    name: "Leather Gloves",
    price: 39.99,
    image: "/images/products/gloves.jpg",
    slug: "leather-gloves",
    rating: 4.7,
    reviewCount: 62
  },
  {
    id: 4,
    name: "Wool Fedora Hat",
    price: 45.99,
    image: "/images/products/hat.jpg",
    slug: "wool-fedora-hat",
    rating: 4.6,
    reviewCount: 41
  },
  {
    id: 5,
    name: "Winter Boots",
    price: 129.99,
    image: "/images/products/boots.jpg",
    slug: "winter-boots",
    rating: 4.8,
    reviewCount: 108
  }
];

// Mock pickup locations
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

export default function ProductDetail({ params }: { params: { slug: string } }) {
  return (
    <div className="bg-white">
      {/* Breadcrumb */}
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center text-sm">
          <Link href="/" className="text-zervia-500 hover:text-zervia-600">Home</Link>
          <span className="mx-2">/</span>
          <Link href="/category/women" className="text-zervia-500 hover:text-zervia-600">Women</Link>
          <span className="mx-2">/</span>
          <Link href="/category/women/outerwear" className="text-zervia-500 hover:text-zervia-600">Outerwear</Link>
          <span className="mx-2">/</span>
          <span className="text-zervia-900">{product.name}</span>
        </div>
      </div>

      {/* Product display */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product images */}
          <div>
            <ImageGallery images={product.images.map((src, index) => ({ 
              id: index.toString(),
              url: src, 
              alt: product.name 
            }))} />
          </div>
          
          {/* Product info */}
          <div className="space-y-6">
            {/* Brand and title */}
            <div>
              <Link href={`/brand/${product.brand}`} className="text-zervia-500 text-sm font-medium">
                {product.brand}
              </Link>
              <h1 className="text-3xl font-bold text-zervia-900 mt-1">{product.name}</h1>
              
              {/* Rating */}
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
                  {product.rating} ({product.reviewCount} reviews)
                </span>
              </div>
            </div>
            
            {/* Price */}
            <div>
              {product.salePrice ? (
                <div className="flex items-baseline">
                  <span className="text-2xl font-bold text-zervia-900">${product.salePrice.toFixed(2)}</span>
                  <span className="ml-2 text-lg text-zervia-500 line-through">${product.price.toFixed(2)}</span>
                  <span className="ml-2 text-sm bg-red-100 text-red-600 px-2 py-0.5 rounded">
                    Save ${(product.price - product.salePrice).toFixed(2)}
                  </span>
                </div>
              ) : (
                <span className="text-2xl font-bold text-zervia-900">${product.price.toFixed(2)}</span>
              )}
            </div>
            
            {/* Short description */}
            <p className="text-zervia-700">{product.description}</p>
            
            {/* Color selection */}
            <div>
              <h3 className="text-sm font-medium text-zervia-900 mb-3">Color</h3>
              <div className="flex space-x-2">
                {product.colors.map((color, index) => (
                  <button
                    key={index}
                    className={`w-8 h-8 rounded-full border-2 ${
                      index === 0
                        ? "border-zervia-600"
                        : "border-transparent hover:border-zervia-400"
                    } focus:outline-none focus:ring-2 focus:ring-zervia-500`}
                    style={{ 
                      backgroundColor: 
                        color.toLowerCase() === "black" ? "#000000" : 
                        color.toLowerCase() === "camel" ? "#C19A6B" : 
                        color.toLowerCase() === "grey" ? "#808080" : 
                        color.toLowerCase() === "navy" ? "#000080" : "#FFFFFF"
                    }}
                    aria-label={`Select ${color} color`}
                  />
                ))}
              </div>
              <p className="mt-2 text-sm text-zervia-700">
                Selected: <span className="font-medium">{product.colors[0]}</span>
              </p>
            </div>
            
            {/* Size selection */}
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-zervia-900">Size</h3>
                <button className="text-sm font-medium text-zervia-600 hover:text-zervia-800">
                  Size Guide
                </button>
              </div>
              <div className="grid grid-cols-5 gap-2 mt-3">
                {product.sizes.map((size, index) => (
                  <button
                    key={index}
                    className={`py-2 border rounded-md text-sm font-medium ${
                      index === 2
                        ? "bg-zervia-600 border-zervia-600 text-white"
                        : "border-gray-300 text-zervia-700 hover:border-zervia-600"
                    } focus:outline-none focus:ring-2 focus:ring-zervia-500`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Quantity and add to cart */}
            <div className="pt-4">
              <div className="flex space-x-4">
                <div className="flex items-center border border-gray-300 rounded-md w-32">
                  <button 
                    className="w-10 h-10 flex items-center justify-center text-zervia-600 hover:bg-zervia-50"
                    aria-label="Decrease quantity"
                  >
                    -
                  </button>
                  <div className="flex-1 text-center">
                    <input
                      type="text"
                      className="w-full h-10 text-center border-0 focus:outline-none focus:ring-0"
                      value="1"
                      readOnly
                    />
                  </div>
                  <button 
                    className="w-10 h-10 flex items-center justify-center text-zervia-600 hover:bg-zervia-50"
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>
                
                <Button size="lg" className="flex-1">
                  <ShoppingCart className="mr-2 h-5 w-5" /> Add to Cart
                </Button>
                
                <Button variant="outline" size="icon" className="h-12 w-12">
                  <Heart className="h-5 w-5 text-zervia-600" />
                </Button>
                
                <Button variant="outline" size="icon" className="h-12 w-12">
                  <Share2 className="h-5 w-5 text-zervia-600" />
                </Button>
              </div>
            </div>
            
            {/* Product details */}
            <div className="pt-6 border-t border-gray-200">
              <div className="flex space-x-4 items-center text-sm">
                <div className="flex items-center text-zervia-600">
                  <Check className="h-5 w-5 mr-1" />
                  <span>In Stock</span>
                </div>
                <div className="flex items-center text-zervia-600">
                  <Truck className="h-5 w-5 mr-1" />
                  <span>Campus Pickup</span>
                </div>
                <div className="flex items-center text-zervia-600">
                  <MapPin className="h-5 w-5 mr-1" />
                  <span>3 Pickup Locations</span>
                </div>
              </div>
            </div>
            
            {/* Pickup locations */}
            <div className="bg-zervia-50 p-4 rounded-lg space-y-3">
              <h3 className="font-medium text-zervia-900">Pickup Locations</h3>
              {pickupLocations.map((location) => (
                <div key={location.id} className="flex items-start py-2 border-b border-zervia-100 last:border-0">
                  <MapPin className="h-5 w-5 text-zervia-600 mt-0.5 flex-shrink-0" />
                  <div className="ml-2">
                    <h4 className="font-medium text-zervia-800">{location.name}</h4>
                    <p className="text-sm text-zervia-600">{location.distance} • {location.availability}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Product tabs: Description, Specs, Reviews */}
        <div className="mt-16">
          <Tabs defaultValue="description">
            <TabsList className="border-b border-gray-200 w-full justify-start">
              <TabsTrigger value="description">Description</TabsTrigger>
              <TabsTrigger value="features">Features & Specs</TabsTrigger>
              <TabsTrigger value="reviews">Reviews ({reviews.length})</TabsTrigger>
            </TabsList>
            
            {/* Description Tab */}
            <TabsContent value="description" className="pt-6">
              <div className="prose max-w-none text-zervia-700">
                <p className="mb-4">{product.longDescription}</p>
                <p>
                  This versatile piece is a staple in any winter wardrobe, offering both style and functionality. 
                  The thoughtfully designed silhouette flatters a variety of body types, while the premium materials 
                  ensure durability season after season.
                </p>
              </div>
            </TabsContent>
            
            {/* Features & Specs Tab */}
            <TabsContent value="features" className="pt-6">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-medium text-zervia-900 mb-4">Features</h3>
                  <ul className="space-y-2">
                    {product.features.map((feature, index) => (
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
                      <span className="text-zervia-900">{product.brand}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm border-b border-gray-200 pb-2">
                      <span className="text-zervia-500">Material</span>
                      <span className="text-zervia-900">80% wool, 20% polyester</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm border-b border-gray-200 pb-2">
                      <span className="text-zervia-500">SKU</span>
                      <span className="text-zervia-900">{product.sku}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm border-b border-gray-200 pb-2">
                      <span className="text-zervia-500">Category</span>
                      <span className="text-zervia-900">
                        <Link href={`/category/${product.category}`} className="text-zervia-600 hover:underline">
                          {product.category.charAt(0).toUpperCase() + product.category.slice(1)}
                        </Link>
                        {" > "}
                        <Link href={`/category/${product.category}/${product.subcategory}`} className="text-zervia-600 hover:underline">
                          {product.subcategory.charAt(0).toUpperCase() + product.subcategory.slice(1)}
                        </Link>
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm border-b border-gray-200 pb-2">
                      <span className="text-zervia-500">Tags</span>
                      <span className="text-zervia-900">
                        {product.tags.map((tag, index) => (
                          <span key={index}>
                            <Link href={`/products?tag=${tag}`} className="text-zervia-600 hover:underline">
                              {tag}
                            </Link>
                            {index < product.tags.length - 1 ? ", " : ""}
                          </span>
                        ))}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <span className="text-zervia-500">Care</span>
                      <span className="text-zervia-900">Dry clean only</span>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            {/* Reviews Tab */}
            <TabsContent value="reviews" className="pt-6">
              <div className="space-y-8">
                {/* Review summary */}
                <div className="flex flex-col md:flex-row gap-8 pb-8 border-b border-gray-200">
                  <div className="md:w-1/3">
                    <h3 className="text-2xl font-bold text-zervia-900">{product.rating} out of 5</h3>
                    <div className="flex mt-2">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i}
                          className={i < Math.floor(product.rating) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}
                        />
                      ))}
                    </div>
                    <p className="mt-1 text-sm text-zervia-600">Based on {product.reviewCount} reviews</p>
                    
                    <Button className="mt-4">Write a Review</Button>
                  </div>
                  
                  <div className="md:w-2/3">
                    <h3 className="text-lg font-medium text-zervia-900 mb-4">Review Breakdown</h3>
                    {[5, 4, 3, 2, 1].map((star) => (
                      <div key={star} className="flex items-center mb-2">
                        <div className="w-8 text-sm text-zervia-700">{star} star</div>
                        <div className="w-full h-2 bg-gray-200 rounded-full mx-2">
                          <div 
                            className="h-2 bg-yellow-400 rounded-full" 
                            style={{ 
                              width: `${star === 5 ? 70 : star === 4 ? 20 : star === 3 ? 5 : star === 2 ? 3 : 2}%` 
                            }}
                          ></div>
                        </div>
                        <div className="w-10 text-sm text-zervia-600 text-right">
                          {star === 5 ? 70 : star === 4 ? 20 : star === 3 ? 5 : star === 2 ? 3 : 2}%
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Individual reviews */}
                <div className="space-y-6">
                  {reviews.map((review) => (
                    <div key={review.id} className="border-b border-gray-200 pb-6 last:border-0">
                      <div className="flex items-center mb-4">
                        <div className="relative h-10 w-10 rounded-full overflow-hidden mr-3">
                          <Image
                            src={review.avatar}
                            alt={review.user}
                            fill
                            className="object-cover"
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
                            <span className="ml-2 text-xs text-zervia-500">{review.date}</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-zervia-700">{review.comment}</p>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
        
        {/* Related products */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-zervia-900 mb-8">You May Also Like</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {relatedProducts.map((product) => (
              <div key={product.id} className="group">
                <Link href={`/product/${product.slug}`}>
                  <div className="relative h-64 rounded-lg overflow-hidden bg-zervia-50 mb-4">
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      className="object-cover transition-transform group-hover:scale-105"
                    />
                  </div>
                </Link>
                <Link href={`/product/${product.slug}`} className="group">
                  <h3 className="font-medium text-zervia-900 group-hover:text-zervia-600 transition-colors">
                    {product.name}
                  </h3>
                </Link>
                <div className="flex items-center mt-1">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i}
                        size={12}
                        className={i < Math.floor(product.rating) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}
                      />
                    ))}
                  </div>
                  <span className="ml-1 text-xs text-zervia-500">
                    ({product.reviewCount})
                  </span>
                </div>
                <div className="mt-2 font-medium text-zervia-900">${product.price.toFixed(2)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}