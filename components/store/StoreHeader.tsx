"use client";

import Image from 'next/image';
import { Star } from 'lucide-react';
import type { Vendor } from '@/types/index';

interface StoreHeaderProps {
  vendor: Vendor;
  averageRating: number;
  reviewsCount: number;
}

export default function StoreHeader({ vendor, averageRating, reviewsCount }: StoreHeaderProps) {
  return (
    <div className="w-full mb-8">
      {/* Banner */}
      <div className="relative h-40 sm:h-56 md:h-72 lg:h-80 w-full rounded-lg overflow-hidden shadow-sm">
        <Image
          src={vendor.banner_url || '/assets/placeholder-product.svg'}
          alt={`${vendor.store_name} banner`}
          fill
          className="object-cover"
          sizes="100vw"
          priority
        />
        <div className="absolute inset-0 bg-black/40" />
        {/* Logo & Name overlay */}
        <div className="absolute bottom-4 left-4 flex items-center gap-4 text-white">
          <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-white">
            <Image
              src={vendor.logo_url || '/assets/placeholder-product.svg'}
              alt={`${vendor.store_name} logo`}
              fill
              className="object-cover"
              sizes="64px"
            />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold drop-shadow-lg">{vendor.store_name}</h1>
            <div className="flex items-center text-sm">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="ml-1 font-medium">{averageRating.toFixed(1)}</span>
              <span className="mx-1">•</span>
              <span>{reviewsCount} reviews</span>
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      {vendor.description && (
        <p className="mt-4 text-sm text-zervia-700 max-w-3xl">
          {vendor.description}
        </p>
      )}
    </div>
  );
} 