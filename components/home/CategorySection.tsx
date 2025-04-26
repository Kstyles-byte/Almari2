import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';

// Mock categories data
const categories = [
  {
    id: 1,
    name: "Women's Fashion",
    image: "/images/categories/womens-fashion.jpg",
    slug: "women",
    itemCount: 245
  },
  {
    id: 2,
    name: "Men's Fashion",
    image: "/images/categories/mens-fashion.jpg",
    slug: "men",
    itemCount: 156
  },
  {
    id: 3,
    name: "Electronics",
    image: "/images/categories/electronics.jpg",
    slug: "electronics",
    itemCount: 89
  },
  {
    id: 4,
    name: "Accessories",
    image: "/images/categories/accessories.jpg",
    slug: "accessories",
    itemCount: 120
  },
  {
    id: 5,
    name: "Home & Living",
    image: "/images/categories/home-living.jpg",
    slug: "home",
    itemCount: 64
  },
  {
    id: 6,
    name: "Beauty & Personal Care",
    image: "/images/categories/beauty.jpg",
    slug: "beauty",
    itemCount: 78
  }
];

const CategorySection = () => {
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
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/category/${category.slug}`}
              className="group flex flex-col rounded-xl overflow-hidden bg-zervia-50 transition-all duration-300 hover:shadow-md"
            >
              <div className="relative h-36 sm:h-40 w-full">
                <Image
                  src={category.image}
                  alt={category.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-4 text-center">
                <h3 className="font-medium text-zervia-900 group-hover:text-zervia-600 transition-colors">
                  {category.name}
                </h3>
                <p className="text-sm text-zervia-500 mt-1">{category.itemCount} items</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategorySection; 