import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Star } from 'lucide-react';
import { Button } from '../ui/button';
import { getFeaturedVendors } from '@/actions/vendors';

// Component for loading state
const VendorShowcaseSkeleton = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {[1, 2, 3].map((item) => (
        <div key={item} className="bg-white rounded-xl overflow-hidden shadow-md animate-pulse">
          <div className="h-48 w-full bg-gray-200"></div>
          <div className="p-5">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
            <div className="h-3 bg-gray-200 rounded w-full mb-3"></div>
            <div className="flex gap-2 mb-4">
              <div className="h-6 w-20 bg-gray-200 rounded-full"></div>
              <div className="h-6 w-20 bg-gray-200 rounded-full"></div>
            </div>
            <div className="flex items-center justify-between">
              <div className="h-3 w-20 bg-gray-200 rounded"></div>
              <div className="h-8 w-24 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const VendorShowcase = async () => {
  const vendors = await getFeaturedVendors(3);

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

        {vendors.length === 0 ? (
          <VendorShowcaseSkeleton />
        ) : (
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
                    {vendor.categories.map((category: string, index: number) => (
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
        )}
      </div>
    </section>
  );
};

export default VendorShowcase;