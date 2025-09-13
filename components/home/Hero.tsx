import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '../ui/button';
import { ArrowRight } from 'lucide-react';
import { getActiveHeroBanner } from '@/lib/services/content';
import { HeroBanner } from '@/types/content';

// Default content if no banner is found in the DB
const defaultBanner: HeroBanner = {
  id: 'default',
  title: 'Shop Your Favorite Products on Campus',
  subtitle: 'Discover a wide range of products from trusted vendors with convenient pickup locations right on campus.',
  buttonText: 'Shop Now',
  buttonLink: '/products',
  imageUrl: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158', // Placeholder image
  imagePublicId: null,
  mobileImageUrl: null,
  mobileImagePublicId: null,
  isActive: true,
  priority: 0,
  startDate: null,
  endDate: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

const Hero = async () => {
  // Fetch the active hero banner using the new service
  const banner = await getActiveHeroBanner() || defaultBanner;

  return (
    <section className="relative bg-gradient-to-r from-zervia-900 to-zervia-800 py-16 md:py-24 text-white overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-[10%] left-[15%] w-72 h-72 rounded-full bg-zervia-400 mix-blend-screen blur-3xl animate-pulse"></div>
        <div className="absolute top-[20%] right-[10%] w-96 h-96 rounded-full bg-zervia-300 mix-blend-screen blur-3xl"></div>
        <div className="absolute bottom-[5%] left-[25%] w-64 h-64 rounded-full bg-zervia-500 mix-blend-screen blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Hero Content */}
          <div className="space-y-6 max-w-lg">
            <div className="inline-block px-4 py-1.5 bg-zervia-700 text-zervia-100 rounded-full font-medium text-sm">
              Campus E-commerce, Simplified
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
              {/* Dynamically display title - Example of conditional styling removed for simplicity */}
              {banner.title}
            </h1>
            <p className="text-lg text-zervia-100">
              {banner.subtitle}
            </p>
            <div className="flex flex-wrap gap-4">
              {banner.buttonText && banner.buttonLink && (
                <Button asChild size="lg" className="font-medium bg-zervia-500 hover:bg-zervia-600 text-white">
                  <Link href={banner.buttonLink}>
                    {banner.buttonText} <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              )}
              <Button asChild variant="outline" size="lg" className="font-medium border-white text-white hover:bg-white/10">
                <Link href="/vendors">
                  Browse Vendors
                </Link>
              </Button>
            </div>

            {/* Static content below - could also be made dynamic if needed */}
            <div className="flex items-center space-x-6 pt-4">
              <div className="flex flex-col">
                <span className="font-bold text-2xl text-white">25+</span>
                <span className="text-zervia-200 text-sm">Local Vendors</span>
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-2xl text-white">500+</span>
                <span className="text-zervia-200 text-sm">Products</span>
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-2xl text-white">2</span>
                <span className="text-zervia-200 text-sm">Pickup Locations</span>
              </div>
            </div>
          </div>

          {/* Hero Image - Use dynamic URL */}
          <div className="relative h-[400px] lg:h-[500px]">
            <Image
              src={banner.imageUrl} // Use the dynamic image URL
              alt={banner.title || 'Zervia Hero Image'} // Use title as alt text
              fill
              className="object-cover rounded-2xl shadow-lg"
              priority
              // Consider adding mobileImageUrl logic here if used
              // sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
            {/* Floating elements remain static for now */}
            <div className="absolute -bottom-6 -left-6 bg-white rounded-xl shadow-lg p-4 w-56 hidden md:block animate-float">
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
            <div className="absolute -right-6 top-16 bg-zervia-50 rounded-lg p-3 shadow-md hidden md:block animate-bounce-gentle">
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
      
      {/* Bottom wave */}
      <div className="absolute bottom-0 left-0 w-full">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 100" fill="white">
          <path d="M0,96L48,80C96,64,192,32,288,26.7C384,21,480,43,576,53.3C672,64,768,64,864,58.7C960,53,1056,43,1152,37.3C1248,32,1344,32,1392,32L1440,32L1440,100L1392,100C1344,100,1248,100,1152,100C1056,100,960,100,864,100C768,100,672,100,576,100C480,100,384,100,288,100C192,100,96,100,48,100L0,100Z"></path>
        </svg>
      </div>
    </section>
  );
};

export default Hero;

// Keep existing animations if they are in the global CSS or Tailwind config
// Example placeholders for animations used:
/*
@keyframes float {
  0% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
  100% { transform: translateY(0px); }
}
@keyframes bounce-gentle {
  0%, 100% { transform: translateY(-5%); animation-timing-function: cubic-bezier(0.8,0,1,1); }
  50% { transform: translateY(0); animation-timing-function: cubic-bezier(0,0,0.2,1); }
}
.animate-float {
  animation: float 3s ease-in-out infinite;
}
.animate-bounce-gentle {
  animation: bounce-gentle 2s infinite;
}
*/