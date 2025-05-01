import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { getAllCategories } from '../../actions/content'
import { Category } from '@/types';

// import { Category } from '../../types/content';

// Fallback images to use when icon is not available
const fallbackCategoryImages = {
  "electronics": "https://images.unsplash.com/photo-1498049794561-7780e7231661?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
  "fashion": "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
  "books": "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
  "food": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
  "beauty": "https://images.unsplash.com/photo-1596462502278-27bfdc403348?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
  "default": "https://images.unsplash.com/photo-1472851294608-062f824d29cc?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"
};

// Function to get an appropriate image for a category
const getCategoryImage = (category: Category): string => {
  // First check if the category has an icon that's a URL
  if (category.icon && category.icon.startsWith('http')) {
    return category.icon;
  }
  
  // Check if we have a fallback for this category slug
  const slugLower = category.slug.toLowerCase();
  for (const [key, url] of Object.entries(fallbackCategoryImages)) {
    if (slugLower.includes(key)) {
      return url;
    }
  }
  
  // Return default fallback
  return fallbackCategoryImages.default;
};

const CategorySection = async () => {
  // Fetch categories from database
  const categories: Category[] = await getAllCategories();
  
  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10">
          <div>
            <h2 className="text-3xl font-bold text-zervia-900">Shop By Category</h2>
            <p className="text-zervia-600 mt-2">Explore our wide range of categories</p>
          </div>
          <Link 
            href="/products" 
            className="inline-flex items-center text-zervia-600 font-medium mt-4 md:mt-0 hover:text-zervia-700 transition-colors"
          >
            View All Categories <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
          {categories.length > 0 ? (
            categories.map((category: Category) => (
              <Link
                key={category.id}
                href={`/products?category=${category.slug}`}
                className="group flex flex-col rounded-xl overflow-hidden bg-zervia-50 transition-all duration-300 hover:shadow-md"
              >
                <div className="relative h-36 sm:h-40 w-full bg-zervia-100">
                  <Image
                    src={getCategoryImage(category)}
                    alt={category.name}
                    fill
                    className="object-cover"
                  />
                  {category.icon && !category.icon.startsWith('http') && (
                    <div className="absolute inset-0 flex items-center justify-center bg-zervia-100/50">
                      <span className="text-5xl">{category.icon}</span>
                    </div>
                  )}
                </div>
                <div className="p-4 text-center">
                  <h3 className="font-medium text-zervia-900 group-hover:text-zervia-600 transition-colors">
                    {category.name}
                  </h3>
                  <p className="text-sm text-zervia-500 mt-1">Explore</p>
                </div>
              </Link>
            ))
          ) : (
            // Fallback UI when no categories are found
            <div className="col-span-full py-10 text-center">
              <p className="text-zervia-500">No categories found. Check back soon!</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default CategorySection; 