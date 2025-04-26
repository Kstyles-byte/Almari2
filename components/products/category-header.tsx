import React from 'react';
import Image from 'next/image';

interface CategoryHeaderProps {
  title: string;
  description?: string;
  imageUrl?: string;
  productCount?: number;
}

export function CategoryHeader({ title, description, imageUrl, productCount }: CategoryHeaderProps) {
  return (
    <div className="w-full mb-8">
      {imageUrl && (
        <div className="w-full h-48 sm:h-64 md:h-80 relative rounded-xl overflow-hidden mb-6">
          <Image 
            src={imageUrl} 
            alt={title} 
            fill 
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zervia-900/60 to-transparent" />
          <div className="absolute bottom-0 left-0 p-6 text-white">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">{title}</h1>
            {description && <p className="max-w-2xl text-white/90">{description}</p>}
          </div>
        </div>
      )}
      
      {!imageUrl && (
        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl font-bold text-zervia-900 mb-2">{title}</h1>
          {description && <p className="max-w-2xl text-zervia-600">{description}</p>}
        </div>
      )}
      
      {productCount !== undefined && (
        <p className="text-zervia-600 mt-2">
          {productCount} {productCount === 1 ? 'product' : 'products'} available
        </p>
      )}
    </div>
  );
} 