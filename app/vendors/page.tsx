import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { getFeaturedVendors } from '@/actions/vendors';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';

const VendorsPage = async () => {
  // Fetch up to 30 approved vendors with stats. Adjust limit as needed once pagination is added.
  const vendors = await getFeaturedVendors(30);

  return (
    <main className="container mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold text-zervia-900 mb-10">All Vendors</h1>

      {vendors.length === 0 ? (
        <p className="text-zervia-600">No vendors found at the moment. Please check back later.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {vendors.map((vendor) => (
            <div
              key={vendor.id}
              className="group relative bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow"
            >
              <div className="relative h-40 w-full">
                <Image
                  src={vendor.image}
                  alt={vendor.name}
                  fill
                  className="object-cover"
                />
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-t from-black/70 to-black/5 opacity-70"></div>
                <div className="absolute bottom-3 left-3 right-3 flex items-center">
                  <div className="relative h-12 w-12 rounded-full overflow-hidden border-2 border-white mr-3">
                    <Image
                      src={vendor.logo}
                      alt={`${vendor.name} logo`}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="text-white">
                    <h3 className="font-semibold text-base leading-tight line-clamp-1">
                      {vendor.name}
                    </h3>
                    <div className="flex items-center text-xs">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3 w-3 ${
                              i < Math.floor(vendor.rating)
                                ? 'text-yellow-400 fill-yellow-400'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="ml-1">({vendor.reviews})</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-4">
                <p className="text-zervia-600 text-sm mb-3 line-clamp-2">
                  {vendor.description}
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {vendor.categories.map((category: string, index: number) => (
                    <span
                      key={index}
                      className="text-xs bg-zervia-50 text-zervia-600 px-2 py-1 rounded-full"
                    >
                      {category}
                    </span>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zervia-500">{vendor.productCount} products</span>
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/store/${vendor.id}`}>Visit Store</Link>
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
};

export default VendorsPage; 