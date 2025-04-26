import React from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Mail, BellRing, Tag, Gift } from 'lucide-react';

const NewsletterSection = () => {
  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="bg-gradient-to-r from-zervia-800 to-zervia-600 rounded-2xl overflow-hidden">
          <div 
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: 'url("/images/pattern-bg.png")',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
          <div className="p-8 md:p-12 relative">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/20 mb-6">
                <Mail className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Stay Updated with Zervia
              </h2>
              <p className="text-white/90 text-lg mb-8 max-w-2xl mx-auto">
                Subscribe to our newsletter for exclusive deals, new vendor announcements, 
                and campus shopping tips delivered to your inbox.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto mb-8">
                <Input 
                  type="email" 
                  placeholder="Your email address" 
                  className="bg-white/90 border-0 text-zervia-800 placeholder:text-zervia-400"
                />
                <Button type="submit" className="bg-white text-zervia-800 hover:bg-zervia-50">
                  Subscribe
                </Button>
              </div>
              
              <div className="flex flex-wrap justify-center gap-8 text-white">
                <div className="flex items-center">
                  <BellRing className="h-5 w-5 mr-2 opacity-80" />
                  <span>New product alerts</span>
                </div>
                <div className="flex items-center">
                  <Tag className="h-5 w-5 mr-2 opacity-80" />
                  <span>Exclusive student discounts</span>
                </div>
                <div className="flex items-center">
                  <Gift className="h-5 w-5 mr-2 opacity-80" />
                  <span>Subscriber-only promotions</span>
                </div>
              </div>
              
              <div className="mt-8 text-white/80 text-sm">
                By subscribing, you agree to receive marketing emails from Zervia. 
                You can unsubscribe at any time.
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default NewsletterSection; 