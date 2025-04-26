import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '../ui/button';
import { ArrowRight } from 'lucide-react';

const Hero = () => {
  return (
    <section className="relative bg-zervia-50 py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Hero Content */}
          <div className="space-y-6 max-w-lg">
            <div className="inline-block px-4 py-1.5 bg-zervia-100 text-zervia-700 rounded-full font-medium text-sm">
              Campus E-commerce, Simplified
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-zervia-900 leading-tight">
              Shop Your <span className="text-zervia-600">Favorite</span> Products on Campus
            </h1>
            <p className="text-lg text-zervia-700">
              Discover a wide range of products from trusted vendors with convenient pickup locations right on campus.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button asChild size="lg" className="font-medium">
                <Link href="/products">
                  Shop Now <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="font-medium">
                <Link href="/vendors">
                  Browse Vendors
                </Link>
              </Button>
            </div>
            <div className="flex items-center space-x-6 pt-4">
              <div className="flex flex-col">
                <span className="font-bold text-2xl text-zervia-900">25+</span>
                <span className="text-zervia-600 text-sm">Local Vendors</span>
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-2xl text-zervia-900">500+</span>
                <span className="text-zervia-600 text-sm">Products</span>
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-2xl text-zervia-900">10+</span>
                <span className="text-zervia-600 text-sm">Pickup Locations</span>
              </div>
            </div>
          </div>

          {/* Hero Image */}
          <div className="relative h-[400px] lg:h-[500px]">
            <Image
              src="/images/hero-shopping.jpg"
              alt="Zervia Shopping Experience"
              fill
              className="object-cover rounded-2xl shadow-lg"
              priority
            />
            <div className="absolute -bottom-6 -left-6 bg-white rounded-xl shadow-lg p-4 w-56 hidden md:block">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-zervia-100 rounded-full flex items-center justify-center text-zervia-600">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 17H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-1" />
                    <polygon points="12 15 17 21 7 21 12 15" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-zervia-500">Agent Pickup</p>
                  <p className="font-medium text-zervia-900">Easy & Convenient</p>
                </div>
              </div>
            </div>
            <div className="absolute -top-6 -right-6 bg-white rounded-xl shadow-lg p-4 w-56 hidden md:block">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-zervia-100 rounded-full flex items-center justify-center text-zervia-600">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-zervia-500">Pricing</p>
                  <p className="font-medium text-zervia-900">Budget Friendly</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero; 