import React from 'react';
import Image from 'next/image';
import { Star, Quote } from 'lucide-react';

// Mock testimonials data
const testimonials = [
  {
    id: 1,
    name: "Sarah Johnson",
    avatar: "/images/avatars/avatar-1.jpg",
    role: "Biology Student",
    content: "Zervia has completely changed my shopping experience on campus. I love being able to pick up my orders between classes without worrying about delivery times.",
    rating: 5
  },
  {
    id: 2,
    name: "Michael Chen",
    avatar: "/images/avatars/avatar-2.jpg",
    role: "Computer Science Major",
    content: "The agent-based pickup system is revolutionary! It's so convenient to collect my tech gadgets from the science building where I spend most of my time.",
    rating: 5
  },
  {
    id: 3,
    name: "Jessica Williams",
    avatar: "/images/avatars/avatar-3.jpg",
    role: "Business Student",
    content: "As a busy student, I appreciate how Zervia saves me time and money. The vendors offer quality products at student-friendly prices.",
    rating: 4
  }
];

const TestimonialSection = () => {
  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-3xl font-bold text-zervia-900 mb-4">What Students Say</h2>
          <p className="text-zervia-600">
            Discover why students across campus love shopping with Zervia.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial) => (
            <div 
              key={testimonial.id} 
              className="bg-zervia-50 rounded-xl p-6 relative"
            >
              <div className="absolute -top-5 -right-2 text-zervia-200">
                <Quote size={48} />
              </div>
              <div className="flex items-center mb-4">
                <div className="relative h-14 w-14 rounded-full overflow-hidden mr-4">
                  <Image
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <h3 className="font-medium text-zervia-900">{testimonial.name}</h3>
                  <p className="text-sm text-zervia-500">{testimonial.role}</p>
                </div>
              </div>
              <div className="flex mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < testimonial.rating
                        ? "text-yellow-400 fill-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
              <p className="text-zervia-700 italic">{testimonial.content}</p>
            </div>
          ))}
        </div>
        
        <div className="mt-16 text-center">
          <div className="inline-flex items-center space-x-2">
            <span className="block w-2 h-2 rounded-full bg-zervia-300"></span>
            <span className="block w-3 h-3 rounded-full bg-zervia-400"></span>
            <span className="block w-4 h-4 rounded-full bg-zervia-500"></span>
            <span className="block w-5 h-5 rounded-full bg-zervia-600"></span>
            <span className="block w-4 h-4 rounded-full bg-zervia-500"></span>
            <span className="block w-3 h-3 rounded-full bg-zervia-400"></span>
            <span className="block w-2 h-2 rounded-full bg-zervia-300"></span>
          </div>
          <p className="text-zervia-600 mt-6 max-w-2xl mx-auto">
            Join thousands of satisfied students who have discovered a better way to shop on campus. 
            Experience the convenience of Zervia today!
          </p>
        </div>
      </div>
    </section>
  );
};

export default TestimonialSection; 