import React from 'react';
import { Card } from '@/components/ui/card';
import Image from 'next/image';

export const metadata = {
  title: 'About Us | Zervia',
  description: 'Learn more about Zervia, our mission, and our team.',
};

export default function AboutPage() {
  return (
    <div className="container mx-auto py-12">
      <div className="mx-auto max-w-4xl space-y-12">
        {/* Hero Section */}
        <div className="text-center">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">About Zervia</h1>
          <p className="mt-4 text-xl text-gray-600">
            Connecting campus communities through trusted e-commerce
          </p>
        </div>
        
        {/* Mission Section */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Our Mission</h2>
            <p className="text-gray-600">
              At Zervia, our mission is to transform campus e-commerce by creating a
              trusted platform that connects vendors with students, faculty, and staff.
              We believe in making on-campus shopping convenient, safe, and personalized.
            </p>
            <p className="text-gray-600">
              Our agent-based delivery model ensures that products are easily accessible
              at convenient campus locations, reducing delivery complications and enhancing
              the overall shopping experience.
            </p>
          </div>
          <div className="relative h-64 overflow-hidden rounded-lg md:h-full">
            <Image
              src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1471&q=80"
              alt="Students working together"
              fill
              style={{ objectFit: 'cover' }}
              className="rounded-lg"
            />
          </div>
        </div>
        
        {/* Values Section */}
        <div className="space-y-6">
          <h2 className="text-center text-2xl font-bold">Our Values</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <Card className="p-6 text-center">
              <h3 className="text-xl font-semibold text-zervia-800">Trust</h3>
              <p className="mt-2 text-gray-600">
                We prioritize building trust through transparent operations, 
                secure transactions, and reliable service delivery.
              </p>
            </Card>
            <Card className="p-6 text-center">
              <h3 className="text-xl font-semibold text-zervia-800">Community</h3>
              <p className="mt-2 text-gray-600">
                We foster vibrant campus communities by connecting students with 
                local vendors and creating shared experiences.
              </p>
            </Card>
            <Card className="p-6 text-center">
              <h3 className="text-xl font-semibold text-zervia-800">Innovation</h3>
              <p className="mt-2 text-gray-600">
                We constantly innovate to improve the campus shopping experience,
                from our agent model to our seamless digital platform.
              </p>
            </Card>
          </div>
        </div>
        
        {/* Story Section */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Our Story</h2>
          <p className="text-gray-600">
            Zervia was founded in 2023 by a group of students who experienced firsthand 
            the challenges of ordering products on campus. Frustrated with delivery 
            complications, unreliable service, and limited access to quality products, 
            they envisioned a better way to connect campus communities with trusted vendors.
          </p>
          <p className="text-gray-600">
            The innovative agent-based delivery model was developed to overcome the unique 
            challenges of campus deliveries. By establishing pickup points managed by trusted 
            agents across campus, Zervia created a system that ensures reliable order fulfillment 
            while supporting local businesses.
          </p>
          <p className="text-gray-600">
            Today, Zervia serves multiple campuses, connecting thousands of students with 
            hundreds of vendors through our growing network of campus agents.
          </p>
        </div>
        
        {/* Join Us Section */}
        <div className="rounded-lg bg-zervia-50 p-8 text-center">
          <h2 className="text-2xl font-bold text-zervia-900">Join the Zervia Community</h2>
          <p className="mx-auto mt-4 max-w-2xl text-gray-600">
            Whether you're a student looking for convenient shopping, a vendor seeking to reach 
            campus customers, or interested in becoming a campus agent, we'd love to have you join our community.
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a href="/auth/signup" className="inline-flex items-center justify-center rounded-md bg-zervia-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-zervia-700 focus:outline-none focus:ring-2 focus:ring-zervia-500 focus:ring-offset-2">
              Sign Up Today
            </a>
            <a href="/contact" className="inline-flex items-center justify-center rounded-md border border-zervia-600 px-6 py-3 text-sm font-medium text-zervia-600 transition-colors hover:bg-zervia-50 focus:outline-none focus:ring-2 focus:ring-zervia-500 focus:ring-offset-2">
              Contact Us
            </a>
          </div>
        </div>
      </div>
    </div>
  );
} 