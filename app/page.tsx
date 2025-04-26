import React from 'react';
import Hero from '../components/home/Hero';
import CategorySection from '../components/home/CategorySection';
import ProductShowcase from '../components/home/ProductShowcase';
import VendorShowcase from '../components/home/VendorShowcase';
import AgentPickupSection from '../components/home/AgentPickupSection';
import NewsletterSection from '../components/home/NewsletterSection';
import TestimonialSection from '../components/home/TestimonialSection';
import WhyChooseUsSection from '../components/home/WhyChooseUsSection';
import SpecialOffersBanner from '../components/home/SpecialOffersBanner';
import TrendingProductsSection from '../components/home/TrendingProductsSection';

export const metadata = {
  title: 'Zervia - Multi-vendor E-commerce Platform',
  description: 'Shop the latest products from various vendors with our agent-based delivery system.',
};

export default function HomePage() {
  return (
    <main>
      <Hero />
      <CategorySection />
      <ProductShowcase />
      <SpecialOffersBanner />
      <TrendingProductsSection />
      <VendorShowcase />
      <AgentPickupSection />
      <TestimonialSection />
      <WhyChooseUsSection />
      <NewsletterSection />
    </main>
  );
} 