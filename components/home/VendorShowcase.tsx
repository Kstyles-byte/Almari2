import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Star } from 'lucide-react';
import { Button } from '../ui/button';

// Mock vendors data
const vendors = [
  {
    id: 1,
    name: "Emporium Elegance",
    description: "Curated fashion and accessories for the style-conscious student.",
    image: "https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?q=80&w=2070",
    logo: "https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?q=80&w=1938",
    rating: 4.8,
    reviews: 156,
    productCount: 78,
    slug: "emporium-elegance",
    categories: ["Women's Fashion", "Accessories"]
  },
  {
    id: 2,
    name: "Urban Threads",
    description: "Trendy street style and casual wear for everyday campus life.",
    image: "https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?q=80&w=2070",
    logo: "https://images.unsplash.com/photo-1622434641406-a158123450f9?q=80&w=1974",
    rating: 4.7,
    reviews: 124,
    productCount: 65,
    slug: "urban-threads",
    categories: ["Men's Fashion", "Women's Fashion"]
  },
  {
    id: 3,
    name: "TechElite",
    description: "Premium tech gadgets and accessories for the modern student.",
    image: "https://images.unsplash.com/photo-1498049794561-7780e7231661?q=80&w=2070",
    logo: "https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?q=80&w=1938",
    rating: 4.9,
    reviews: 198,
    productCount: 42,
    slug: "tech-elite",
    categories: ["Electronics", "Accessories"]
  }
];

const VendorShowcase = () => {
  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10">
          <div>
            <h2 className="text-3xl font-bold text-zervia-900">Featured Vendors</h2>
            <p className="text-zervia-600 mt-2">Discover trusted vendors on campus</p>
          </div>
          <Link
            href="/vendors"
            className="inline-flex items-center text-zervia-600 font-medium mt-4 md:mt-0 hover:text-zervia-700 transition-colors"
          >
            View All Vendors <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {vendors.map((vendor) => (
            <div key={vendor.id} className="group relative bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow">
              <div className="relative h-48 w-full">
                <Image
                  src={vendor.image}
                  alt={vendor.name}
                  fill
                  className="object-cover"
                />
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-t from-black/70 to-black/5 opacity-70"></div>
                <div className="absolute bottom-4 left-4 right-4 flex items-center">
                  <div className="relative h-14 w-14 rounded-full overflow-hidden border-2 border-white mr-3">
                    <Image
                      src={vendor.logo}
                      alt={`${vendor.name} logo`}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="text-white">
                    <h3 className="font-semibold text-lg">{vendor.name}</h3>
                    <div className="flex items-center text-xs">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3 w-3 ${
                              i < Math.floor(vendor.rating)
                                ? "text-yellow-400 fill-yellow-400"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="ml-1">({vendor.reviews})</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-5">
                <p className="text-zervia-600 text-sm mb-3 line-clamp-2">{vendor.description}</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {vendor.categories.map((category, index) => (
                    <span key={index} className="text-xs bg-zervia-50 text-zervia-600 px-2 py-1 rounded-full">
                      {category}
                    </span>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zervia-500">{vendor.productCount} products</span>
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/vendor/${vendor.slug}`}>
                      Visit Store
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default VendorShowcase; 