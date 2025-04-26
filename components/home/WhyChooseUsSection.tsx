import React from 'react';
import { MapPin, Clock, CreditCard, RotateCcw, ShieldCheck, Store } from 'lucide-react';

const features = [
  {
    icon: <MapPin className="h-6 w-6" />,
    title: "Convenient Campus Locations",
    description: "Multiple pickup points conveniently located throughout campus for easy access between classes.",
  },
  {
    icon: <Clock className="h-6 w-6" />,
    title: "Quick Turnaround",
    description: "Orders processed quickly and available for pickup within 24-48 hours.",
  },
  {
    icon: <CreditCard className="h-6 w-6" />,
    title: "Secure Payments",
    description: "Multiple secure payment options including credit/debit cards and mobile payments.",
  },
  {
    icon: <RotateCcw className="h-6 w-6" />,
    title: "Easy Returns",
    description: "Hassle-free return process within 24 hours of pickup if you're not satisfied.",
  },
  {
    icon: <ShieldCheck className="h-6 w-6" />,
    title: "Verified Vendors",
    description: "All vendors are thoroughly vetted to ensure quality products and service.",
  },
  {
    icon: <Store className="h-6 w-6" />,
    title: "Wide Product Selection",
    description: "From electronics to fashion, find everything you need for campus life.",
  },
];

const WhyChooseUsSection = () => {
  return (
    <section className="py-16 bg-zervia-50">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-3xl font-bold text-zervia-900 mb-4">Why Choose Zervia</h2>
          <p className="text-zervia-600">
            We're revolutionizing campus shopping with our agent-based delivery model,
            providing convenience and reliability for student shoppers.
          </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="w-12 h-12 rounded-full bg-zervia-100 flex items-center justify-center text-zervia-600 mb-4">
                {feature.icon}
              </div>
              <h3 className="font-medium text-zervia-900 text-lg mb-2">{feature.title}</h3>
              <p className="text-zervia-600">{feature.description}</p>
            </div>
          ))}
        </div>
        
        <div className="mt-16 text-center">
          <div className="inline-block px-6 py-3 bg-zervia-100 text-zervia-700 rounded-full font-medium">
            Join 5,000+ students already shopping with Zervia
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUsSection; 