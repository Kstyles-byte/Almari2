import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, ShoppingCart, Heart, Star } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardFooter } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';

// Mock product data
const products = {
  featured: [
    {
      id: 1,
      name: "Structured Cotton Blouse",
      price: 59.99,
      image: "/images/products/product-1.jpg",
      rating: 4.8,
      reviews: 124,
      isNew: true,
      vendor: "Emporium Elegance",
      slug: "structured-cotton-blouse"
    },
    {
      id: 2,
      name: "Classic Leather Sneakers",
      price: 89.99,
      image: "/images/products/product-2.jpg",
      rating: 4.5,
      reviews: 86,
      isNew: false,
      vendor: "Urban Threads",
      slug: "classic-leather-sneakers"
    },
    {
      id: 3,
      name: "Relaxed Fit Denim Jacket",
      price: 79.99,
      image: "/images/products/product-3.jpg",
      rating: 4.6,
      reviews: 62,
      isNew: true,
      vendor: "Urban Threads",
      slug: "relaxed-fit-denim-jacket"
    },
    {
      id: 4,
      name: "Summer Floral Dress",
      price: 65.99,
      image: "/images/products/product-4.jpg",
      rating: 4.9,
      reviews: 42,
      isNew: true,
      vendor: "Velvet Vault",
      slug: "summer-floral-dress"
    },
    {
      id: 5,
      name: "Minimalist Wrist Watch",
      price: 129.99,
      image: "/images/products/product-5.jpg",
      rating: 5.0,
      reviews: 18,
      isNew: false,
      vendor: "Emporium Elegance",
      slug: "minimalist-wrist-watch"
    },
    {
      id: 6,
      name: "Organic Cotton T-shirt",
      price: 34.99,
      image: "/images/products/product-6.jpg",
      rating: 4.4,
      reviews: 76,
      isNew: false,
      vendor: "Urban Threads",
      slug: "organic-cotton-tshirt"
    },
    {
      id: 7,
      name: "Designer Sunglasses",
      price: 149.99,
      image: "/images/products/product-7.jpg",
      rating: 4.7,
      reviews: 53,
      isNew: true,
      vendor: "Emporium Elegance",
      slug: "designer-sunglasses"
    },
    {
      id: 8,
      name: "High-Waisted Jeans",
      price: 79.99,
      image: "/images/products/product-8.jpg",
      rating: 4.6,
      reviews: 94,
      isNew: false,
      vendor: "Velvet Vault",
      slug: "high-waisted-jeans"
    }
  ],
  bestsellers: [
    {
      id: 9,
      name: "Wireless Earbuds",
      price: 89.99,
      image: "/images/products/product-9.jpg",
      rating: 4.9,
      reviews: 210,
      isNew: false,
      vendor: "TechElite",
      slug: "wireless-earbuds"
    },
    {
      id: 10,
      name: "Leather Crossbody Bag",
      price: 119.99,
      image: "/images/products/product-10.jpg",
      rating: 4.8,
      reviews: 175,
      isNew: false,
      vendor: "Velvet Vault",
      slug: "leather-crossbody-bag"
    },
    {
      id: 11,
      name: "Smartphone Stand",
      price: 19.99,
      image: "/images/products/product-11.jpg",
      rating: 4.6,
      reviews: 142,
      isNew: false,
      vendor: "TechElite",
      slug: "smartphone-stand"
    },
    {
      id: 12,
      name: "Cotton Graphic Tee",
      price: 29.99,
      image: "/images/products/product-12.jpg",
      rating: 4.7,
      reviews: 163,
      isNew: true,
      vendor: "Urban Threads",
      slug: "cotton-graphic-tee"
    },
    {
      id: 13,
      name: "Stainless Steel Water Bottle",
      price: 24.99,
      image: "/images/products/product-13.jpg",
      rating: 4.9,
      reviews: 189,
      isNew: false,
      vendor: "EcoWare",
      slug: "stainless-steel-water-bottle"
    },
    {
      id: 14,
      name: "Knit Beanie",
      price: 19.99,
      image: "/images/products/product-14.jpg",
      rating: 4.5,
      reviews: 122,
      isNew: false,
      vendor: "Urban Threads",
      slug: "knit-beanie"
    },
    {
      id: 15,
      name: "Portable Charger",
      price: 39.99,
      image: "/images/products/product-15.jpg",
      rating: 4.7,
      reviews: 151,
      isNew: false,
      vendor: "TechElite",
      slug: "portable-charger"
    },
    {
      id: 16,
      name: "Campus Backpack",
      price: 69.99,
      image: "/images/products/product-16.jpg",
      rating: 4.8,
      reviews: 187,
      isNew: true,
      vendor: "Urban Threads",
      slug: "campus-backpack"
    }
  ],
  newArrivals: [
    {
      id: 17,
      name: "Noise Cancelling Headphones",
      price: 159.99,
      image: "/images/products/product-17.jpg",
      rating: 4.9,
      reviews: 32,
      isNew: true,
      vendor: "TechElite",
      slug: "noise-cancelling-headphones"
    },
    {
      id: 18,
      name: "Oversized Denim Shirt",
      price: 59.99,
      image: "/images/products/product-18.jpg",
      rating: 4.7,
      reviews: 28,
      isNew: true,
      vendor: "Urban Threads",
      slug: "oversized-denim-shirt"
    },
    {
      id: 19,
      name: "Minimalist Gold Necklace",
      price: 49.99,
      image: "/images/products/product-19.jpg",
      rating: 4.8,
      reviews: 25,
      isNew: true,
      vendor: "Velvet Vault",
      slug: "minimalist-gold-necklace"
    },
    {
      id: 20,
      name: "Vegan Leather Wallet",
      price: 39.99,
      image: "/images/products/product-20.jpg",
      rating: 4.6,
      reviews: 21,
      isNew: true,
      vendor: "EcoWare",
      slug: "vegan-leather-wallet"
    },
    {
      id: 21,
      name: "Blue Light Glasses",
      price: 29.99,
      image: "/images/products/product-21.jpg",
      rating: 4.5,
      reviews: 18,
      isNew: true,
      vendor: "EyeComfort",
      slug: "blue-light-glasses"
    },
    {
      id: 22,
      name: "Plant-Based Protein Powder",
      price: 44.99,
      image: "/images/products/product-22.jpg",
      rating: 4.7,
      reviews: 24,
      isNew: true,
      vendor: "VitalBoost",
      slug: "plant-based-protein-powder"
    },
    {
      id: 23,
      name: "Recycled Canvas Tote",
      price: 34.99,
      image: "/images/products/product-23.jpg",
      rating: 4.8,
      reviews: 29,
      isNew: true,
      vendor: "EcoWare",
      slug: "recycled-canvas-tote"
    },
    {
      id: 24,
      name: "Wireless Charging Pad",
      price: 29.99,
      image: "/images/products/product-24.jpg",
      rating: 4.6,
      reviews: 26,
      isNew: true,
      vendor: "TechElite",
      slug: "wireless-charging-pad"
    }
  ],
};

// Product Card Component
const ProductCard = ({ product }: { product: typeof products.featured[0] }) => {
  return (
    <Card className="group h-full flex flex-col">
      <div className="relative overflow-hidden">
        <Link href={`/product/${product.slug}`}>
          <div className="relative h-60 w-full overflow-hidden">
            <Image
              src={product.image}
              alt={product.name}
              fill
              className="object-cover transition-transform group-hover:scale-105"
            />
          </div>
        </Link>
        {product.isNew && (
          <Badge className="absolute top-3 left-3 bg-zervia-600">New</Badge>
        )}
        <div className="absolute top-3 right-3 space-y-2">
          <Button size="icon" variant="outline" className="h-8 w-8 rounded-full bg-white opacity-90 hover:opacity-100">
            <Heart className="h-4 w-4 text-zervia-600" />
          </Button>
        </div>
      </div>
      <CardContent className="pt-4 flex-grow">
        <Link href={`/product/${product.slug}`} className="group">
          <h3 className="font-medium text-zervia-900 group-hover:text-zervia-600 transition-colors line-clamp-2">
            {product.name}
          </h3>
        </Link>
        <p className="text-sm text-zervia-500 mt-1">{product.vendor}</p>
        <div className="flex items-center mt-2">
          <div className="flex">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`h-3.5 w-3.5 ${
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
      </CardContent>
      <CardFooter className="pt-0 flex-shrink-0">
        <div className="flex w-full items-center justify-between">
          <div className="font-semibold text-zervia-900">${product.price.toFixed(2)}</div>
          <Button size="sm" className="rounded-lg">
            <ShoppingCart className="h-4 w-4 mr-1" /> Add
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

const ProductShowcase = () => {
  return (
    <section className="py-16 bg-zervia-50">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-zervia-900">Featured Products</h2>
            <p className="text-zervia-600 mt-2">Discover our handpicked selection of products</p>
          </div>
          <Link
            href="/products"
            className="inline-flex items-center text-zervia-600 font-medium mt-4 md:mt-0 hover:text-zervia-700 transition-colors"
          >
            View All Products <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>

        <Tabs defaultValue="featured" className="w-full">
          <TabsList className="mb-8 bg-transparent">
            <TabsTrigger value="featured">Featured</TabsTrigger>
            <TabsTrigger value="bestsellers">Best Sellers</TabsTrigger>
            <TabsTrigger value="newArrivals">New Arrivals</TabsTrigger>
          </TabsList>
          
          <TabsContent value="featured" className="mt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {products.featured.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="bestsellers" className="mt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {products.bestsellers.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="newArrivals" className="mt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {products.newArrivals.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
};

export default ProductShowcase; 