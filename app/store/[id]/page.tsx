import { notFound } from "next/navigation";
import prisma from "../../../lib/server/prisma";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../components/ui/tabs";
import { Button } from "../../../components/ui/button";
import { ProductGrid } from "../../../components/products/product-grid";

export async function generateMetadata({ params }: { params: { id: string } }) {
  const vendor = await prisma.vendor.findUnique({
    where: { id: params.id },
  });

  if (!vendor) {
    return {
      title: "Store Not Found",
    };
  }

  return {
    title: `${vendor.storeName || "Store"} | Zervia`,
    description: vendor.storeDescription || "Vendor store on Zervia marketplace",
  };
}

export default async function StorePage({ params }: { params: { id: string } }) {
  const vendor = await prisma.vendor.findUnique({
    where: { id: params.id },
    include: {
      user: {
        select: {
          name: true,
          image: true,
        },
      },
    },
  });

  if (!vendor) {
    notFound();
  }

  // Fetch featured products
  const featuredProducts = await prisma.product.findMany({
    where: {
      vendorId: vendor.id,
      isFeatured: true,
      isActive: true,
    },
    include: {
      category: true,
      images: {
        take: 1,
      },
      reviews: {
        select: {
          rating: true,
        },
      },
    },
    take: 4,
  });

  // Fetch all categories this vendor has products in
  const categories = await prisma.category.findMany({
    where: {
      products: {
        some: {
          vendorId: vendor.id,
          isActive: true,
        },
      },
    },
  });

  // Fetch all products
  const products = await prisma.product.findMany({
    where: {
      vendorId: vendor.id,
      isActive: true,
    },
    include: {
      category: true,
      images: {
        take: 1,
      },
      reviews: {
        select: {
          rating: true,
        },
      },
    },
  });

  // Calculate average rating
  const totalReviews = products.reduce((acc, product) => acc + product.reviews.length, 0);
  const avgRating = products.reduce((acc, product) => {
    const productAvg = product.reviews.reduce((sum, review) => sum + review.rating, 0) / 
                     (product.reviews.length || 1);
    return acc + (productAvg * product.reviews.length);
  }, 0) / (totalReviews || 1);

  // Group products by category
  const productsByCategory = categories.map(category => {
    return {
      category,
      products: products.filter(product => product.categoryId === category.id),
    };
  });

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Store Banner */}
      <div className="relative w-full h-48 md:h-64 overflow-hidden rounded-lg mb-8">
        {vendor.bannerImage ? (
          <img 
            src={vendor.bannerImage} 
            alt={`${vendor.storeName} Banner`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
            <h1 className="text-white text-3xl md:text-4xl font-bold">{vendor.storeName}</h1>
          </div>
        )}
      </div>

      {/* Store Info Section */}
      <div className="flex flex-col md:flex-row gap-6 mb-10">
        <div className="flex-shrink-0">
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-lg overflow-hidden border-4 border-white shadow-lg -mt-16 md:-mt-20 bg-white relative z-10">
            {vendor.logoImage ? (
              <img 
                src={vendor.logoImage} 
                alt={`${vendor.storeName} Logo`} 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-white text-2xl font-bold">
                {vendor.storeName ? vendor.storeName.charAt(0) : "S"}
              </div>
            )}
          </div>
        </div>

        <div className="flex-grow">
          <h1 className="text-3xl font-bold mb-2">{vendor.storeName}</h1>
          {vendor.storeTagline && (
            <p className="text-lg text-gray-600 mb-3">{vendor.storeTagline}</p>
          )}
          <p className="text-gray-600 mb-4">{vendor.storeDescription}</p>
          
          <div className="flex flex-wrap gap-6 mb-4">
            <div>
              <span className="text-gray-600">Products</span>
              <p className="text-xl font-semibold">{products.length}</p>
            </div>
            <div>
              <span className="text-gray-600">Categories</span>
              <p className="text-xl font-semibold">{categories.length}</p>
            </div>
            <div>
              <span className="text-gray-600">Rating</span>
              <p className="text-xl font-semibold flex items-center">
                {avgRating.toFixed(1)}
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-yellow-500 ml-1">
                  <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                </svg>
                <span className="text-sm text-gray-600 ml-1">
                  ({totalReviews} reviews)
                </span>
              </p>
            </div>
          </div>
          
          <div className="flex gap-2 flex-wrap">
            {vendor.websiteUrl && (
              <a href={vendor.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-sm bg-gray-100 hover:bg-gray-200 rounded-full px-4 py-2">
                Website
              </a>
            )}
            {vendor.instagramHandle && (
              <a href={`https://instagram.com/${vendor.instagramHandle.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="text-sm bg-gray-100 hover:bg-gray-200 rounded-full px-4 py-2">
                Instagram
              </a>
            )}
            {vendor.twitterHandle && (
              <a href={`https://twitter.com/${vendor.twitterHandle.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="text-sm bg-gray-100 hover:bg-gray-200 rounded-full px-4 py-2">
                Twitter
              </a>
            )}
            {vendor.facebookUrl && (
              <a href={vendor.facebookUrl} target="_blank" rel="noopener noreferrer" className="text-sm bg-gray-100 hover:bg-gray-200 rounded-full px-4 py-2">
                Facebook
              </a>
            )}
          </div>
        </div>
      </div>
      
      {/* Featured Products Section */}
      {featuredProducts.length > 0 && (
        <div className="mb-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Featured Products</h2>
            <a href={`/products?vendor=${vendor.id}`} className="text-blue-600 hover:underline">
              View All Products
            </a>
          </div>
          <ProductGrid products={featuredProducts} />
        </div>
      )}

      {/* Store Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="all">All Products</TabsTrigger>
          {categories.map((category) => (
            <TabsTrigger key={category.id} value={category.id}>
              {category.name}
            </TabsTrigger>
          ))}
          <TabsTrigger value="policies">Policies</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all">
          <div className="mb-8">
            <ProductGrid products={products} />
          </div>
        </TabsContent>
        
        {productsByCategory.map(({ category, products }) => (
          <TabsContent key={category.id} value={category.id}>
            <div className="mb-8">
              <ProductGrid products={products} />
            </div>
          </TabsContent>
        ))}
        
        <TabsContent value="policies">
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {vendor.returnPolicy && (
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-xl font-semibold mb-4">Return Policy</h3>
                <div className="prose max-w-none">
                  <p className="whitespace-pre-line">{vendor.returnPolicy}</p>
                </div>
              </div>
            )}
            
            {vendor.shippingPolicy && (
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-xl font-semibold mb-4">Shipping Policy</h3>
                <div className="prose max-w-none">
                  <p className="whitespace-pre-line">{vendor.shippingPolicy}</p>
                </div>
              </div>
            )}
            
            {vendor.privacyPolicy && (
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-xl font-semibold mb-4">Privacy Policy</h3>
                <div className="prose max-w-none">
                  <p className="whitespace-pre-line">{vendor.privacyPolicy}</p>
                </div>
              </div>
            )}
            
            {!vendor.returnPolicy && !vendor.shippingPolicy && !vendor.privacyPolicy && (
              <div className="col-span-2 text-center py-12 text-gray-500">
                <p>This store hasn't provided any policy information yet.</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 