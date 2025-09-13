import React from 'react';
import Link from 'next/link';
import { Instagram, Mail } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

const Footer = () => {
  return (
    <footer className="bg-zervia-900 text-white pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Company Info */}
          <div>
            <h3 className="text-xl font-bold mb-4">Zervia</h3>
            <p className="text-zervia-100 text-sm mb-4">
              An all in one e-commerce platform built for campus communities.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-zervia-200 hover:text-white">
                <svg width={18} height={18} viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"/>
                </svg>
              </a>
              <a href="#" className="text-zervia-200 hover:text-white">
                <Instagram size={18} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/products" className="text-zervia-200 hover:text-white transition-colors">
                  Products
                </Link>
              </li>
              <li>
                <Link href="/vendors" className="text-zervia-200 hover:text-white transition-colors">
                  Vendors
                </Link>
              </li>
              <li>
                <Link href="/locations" className="text-zervia-200 hover:text-white transition-colors">
                  Pickup Locations
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-zervia-200 hover:text-white transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-zervia-200 hover:text-white transition-colors">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Help & Support */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Help & Support</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/faq" className="text-zervia-200 hover:text-white transition-colors">
                  FAQs
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-zervia-200 hover:text-white transition-colors">
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-zervia-200 hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/returns" className="text-zervia-200 hover:text-white transition-colors">
                  Return Policy
                </Link>
              </li>
              <li>
                <Link href="/help" className="text-zervia-200 hover:text-white transition-colors">
                  Help Center
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Newsletter</h3>
            <p className="text-zervia-200 text-sm mb-4">
              Subscribe to our newsletter for exclusive deals and updates.
            </p>
            <div className="flex space-x-2">
              <Input 
                type="email" 
                placeholder="Your email address" 
                className="bg-zervia-800 border-zervia-700 text-white placeholder:text-zervia-400"
              />
              <Button>
                <Mail className="h-4 w-4 mr-2" />
                <span>Subscribe</span>
              </Button>
              </div>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="border-t border-zervia-800 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-zervia-300 text-sm">
              &copy; {new Date().getFullYear()} Zervia. All rights reserved.
            </p>
            <div className="flex space-x-4 mt-4 md:mt-0">
              <a href="#" className="text-zervia-300 hover:text-white text-sm">
                Privacy Policy
              </a>
              <a href="#" className="text-zervia-300 hover:text-white text-sm">
                Terms of Service
              </a>
              <a href="#" className="text-zervia-300 hover:text-white text-sm">
                Cookies
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 