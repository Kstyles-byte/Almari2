import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Star } from 'lucide-react';
import { Button } from '../ui/button';

// Mock trending products data
const trendingProducts = [
  {
    id: 101,
    name: "Wireless Noise Cancelling Headphones",
    price: 159.99,
    image: "/images/products/trending-1.jpg",
    rating: 4.9,
    reviews: 218,
    vendor: "TechElite",
    slug: "wireless-noise-cancelling-headphones",
    category: "electronics"
  },
  {
    id: 102,
    name: "Organic Cotton Loungewear Set",
    price: 89.99,
    image: "/images/products/trending-2.jpg",
    rating: 4.8,
    reviews: 183,
    vendor: "Comfort Essentials",
    slug: "organic-cotton-loungewear-set",
    category: "women"
  },
  {
    id: 103,
    name: "Smart Watch Series 5",
    price: 229.99,
    image: "/images/products/trending-3.jpg",
    rating: 4.7,
    reviews: 156,
    vendor: "TechElite",
    slug: "smart-watch-series-5",
    category: "electronics"
  }
];

const TrendingProductsSection = () => {
  return (
    <section className="py-16 bg-zervia-50">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-zervia-900">Trending Now</h2>
            <p className="text-zervia-600 mt-2">See what's popular on campus this week</p>
          </div>
          <Link
            href="/products?sort=trending"
            className="inline-flex items-center text-zervia-600 font-medium mt-4 md:mt-0 hover:text-zervia-700 transition-colors"
          >
            View All Trending <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {trendingProducts.map((product) => (
            <div key={product.id} className="group relative bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow">
              <div className="flex flex-col md:flex-row h-full">
                <div className="relative md:w-2/5 h-48 md:h-auto overflow-hidden">
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute top-3 left-3 bg-white/90 text-zervia-600 px-3 py-1 rounded-full text-sm font-medium">
                    Trending
                  </div>
                </div>
                <div className="p-5 flex flex-col md:w-3/5">
                  <div className="mb-2">
                    <Link href={`/category/${product.category}`}>
                      <span className="text-xs text-zervia-500 uppercase tracking-wider">{product.category}</span>
                    </Link>
                  </div>
                  <Link href={`/product/${product.slug}`} className="group">
                    <h3 className="font-medium text-lg text-zervia-900 group-hover:text-zervia-600 transition-colors mb-2">
                      {product.name}
                    </h3>
                  </Link>
                  <p className="text-sm text-zervia-500 mb-2">{product.vendor}</p>
                  <div className="flex items-center mb-3">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < Math.floor(product.rating)
                              ? "text-yellow-400 fill-yellow-400"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-zervia-500 ml-1">
                      ({product.reviews})
                    </span>
                  </div>
                  <div className="mt-auto flex items-center justify-between">
                    <span className="text-lg font-bold text-zervia-900">${product.price.toFixed(2)}</span>
                    <Button asChild variant="default" size="sm">
                      <Link href={`/product/${product.slug}`}>
                        View Product
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrendingProductsSection; 