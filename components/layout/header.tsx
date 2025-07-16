"use client"

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation'; // Add this import
import { ShoppingCart, User, Menu, X } from 'lucide-react';
import { Button } from '../ui/button';
import { Icons } from '../icons';
import { useCart } from '@/hooks/useCart'; // Use cart hook
import { SearchBox } from '../ui/search-box'; // Import the SearchBox component
import { NotificationCenter } from '../notifications/notification-center';

const Header = () => {
  const pathname = usePathname(); // Get current pathname
  const isHomePage = pathname === '/'; // Check if we're on home page
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const cartItems = useCart();
  const cartItemCount = cartItems.reduce((sum, i) => sum + i.qty, 0);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };
  
  // Handle scroll effect
  useEffect(() => {
    // Set initial scroll state based on current window position
    if (window.scrollY > 50) {
      setIsScrolled(true);
    } else {
      setIsScrolled(false);
    }
    
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header 
      className={`fixed top-0 left-0 w-full z-30 transition-all duration-300 ${
        // Different header styling logic based on page and scroll position
        isHomePage 
          ? isScrolled 
            ? "bg-white shadow-md py-3" 
            : "bg-transparent py-5"
          : "bg-white shadow-md py-3" // Non-home pages always have white bg
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center relative z-50">
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">
              <span className="text-zervia-500">Z</span>
              <span className={
                // Text color based on page and scroll position
                (isHomePage && !isScrolled) ? "text-white" : "text-zervia-900"
              }>ervia</span>
            </h1>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link 
              href="/products" 
              className={`relative text-sm font-medium ${
                (isHomePage && !isScrolled) ? "text-white" : "text-zervia-900"
              } hover:text-zervia-500 transition-colors`}
            >
              Products
            </Link>
            <Link 
              href="/category/women" 
              className={`relative text-sm font-medium ${
                (isHomePage && !isScrolled) ? "text-white" : "text-zervia-900"
              } hover:text-zervia-500 transition-colors`}
            >
              Women
            </Link>
            <Link 
              href="/category/men" 
              className={`relative text-sm font-medium ${
                (isHomePage && !isScrolled) ? "text-white" : "text-zervia-900"
              } hover:text-zervia-500 transition-colors`}
            >
              Men
            </Link>
            <Link 
              href="/category/kids" 
              className={`relative text-sm font-medium ${
                (isHomePage && !isScrolled) ? "text-white" : "text-zervia-900"
              } hover:text-zervia-500 transition-colors`}
            >
              Kids
            </Link>
            <Link 
              href="/category/accessories" 
              className={`relative text-sm font-medium ${
                (isHomePage && !isScrolled) ? "text-white" : "text-zervia-900"
              } hover:text-zervia-500 transition-colors`}
            >
              Accessories
            </Link>
            <Link 
              href="/category/home" 
              className={`relative text-sm font-medium ${
                (isHomePage && !isScrolled) ? "text-white" : "text-zervia-900"
              } hover:text-zervia-500 transition-colors`}
            >
              Home
            </Link>
          </nav>

          {/* Search and Actions */}
          <div className="flex items-center space-x-4">
            {/* SearchBox component replaces the search button */}
            <div className="hidden md:block w-48 lg:w-64">
              <SearchBox 
                placeholder="Search..."
                className={isHomePage && !isScrolled ? "search-light" : ""}
              />
            </div>
            
            {/* Notification Center */}
            <div className="hidden md:block">
              <NotificationCenter 
                className={isHomePage && !isScrolled ? "text-white" : "text-zervia-900"}
              />
            </div>
            
            <Link 
              href="/account" 
              className={`p-2 rounded-full hover:bg-zervia-50 transition-colors ${
                (isHomePage && !isScrolled) ? "text-white" : "text-zervia-900"
              }`}
            >
              <User className="h-5 w-5" />
            </Link>
            <Link 
              href="/cart" 
              className="relative p-2"
            >
              <div className={`p-2 rounded-full hover:bg-zervia-50 transition-colors ${
                (isHomePage && !isScrolled) ? "text-white" : "text-zervia-900"
              }`}>
                <ShoppingCart className="h-5 w-5" />
              </div>
              {/* Only show the badge if there are items in the cart */}
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-zervia-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {cartItemCount}
                </span>
              )}
            </Link>

            {/* Notification Center for Mobile */}
            <div className="block md:hidden">
              <NotificationCenter 
                className={isHomePage && !isScrolled ? "text-white" : "text-zervia-900"}
              />
            </div>

            <button 
              onClick={toggleMobileMenu}
              className={`md:hidden p-2 rounded-full hover:bg-zervia-50 transition-colors ${
                (isHomePage && !isScrolled) ? "text-white" : "text-zervia-900"
              }`}
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={toggleMobileMenu} 
        />
      )}

      {/* Mobile Menu Panel */}
      <div className={`
        fixed top-0 right-0 h-full w-4/5 max-w-sm bg-white z-50 transform transition-transform duration-300 ease-in-out md:hidden shadow-lg
        ${mobileMenuOpen ? "translate-x-0" : "translate-x-full"}
      `}
        // Add onClick stopPropagation to prevent clicks inside the menu from closing it via the overlay
        onClick={(e) => e.stopPropagation()} 
      >
        {/* Add explicit top bar for close button */}
        <div className="flex justify-end p-4 border-b border-gray-200">
           <button 
              onClick={toggleMobileMenu}
              className={`p-2 rounded-full text-gray-600 hover:bg-gray-100`}
              aria-label="Close mobile menu"
            >
              <X className="h-6 w-6" />
            </button>
        </div>
        
        {/* Adjust padding-top to account for the new close button bar */}
        <div className="container mx-auto px-4 py-8 overflow-y-auto h-[calc(100%-65px)]"> {/* Adjust height calculation */}
          {/* Mobile Search */}
          <div className="mb-6">
            <SearchBox placeholder="Search products..." />
          </div>
          <div className="flex flex-col space-y-6">
            <Link 
              href="/products" 
              className="text-xl font-medium text-zervia-900 py-2 border-b border-zervia-100"
              onClick={() => setMobileMenuOpen(false)}
            >
              Products
            </Link>
            <Link 
              href="/category/women" 
              className="text-xl font-medium text-zervia-900 py-2 border-b border-zervia-100"
              onClick={() => setMobileMenuOpen(false)}
            >
              Women
            </Link>
            <Link 
              href="/category/men" 
              className="text-xl font-medium text-zervia-900 py-2 border-b border-zervia-100"
              onClick={() => setMobileMenuOpen(false)}
            >
              Men
            </Link>
            <Link 
              href="/category/kids" 
              className="text-xl font-medium text-zervia-900 py-2 border-b border-zervia-100"
              onClick={() => setMobileMenuOpen(false)}
            >
              Kids
            </Link>
            <Link 
              href="/category/accessories" 
              className="text-xl font-medium text-zervia-900 py-2 border-b border-zervia-100"
              onClick={() => setMobileMenuOpen(false)}
            >
              Accessories
            </Link>
            <Link 
              href="/category/home" 
              className="text-xl font-medium text-zervia-900 py-2 border-b border-zervia-100"
              onClick={() => setMobileMenuOpen(false)}
            >
              Home
            </Link>
            <div className="pt-6 space-y-4">
              <Link 
                href="/account/orders"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center space-x-2 text-zervia-700"
              >
                <span>My Orders</span>
              </Link>
              <Link 
                href="/account/wishlist"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center space-x-2 text-zervia-700"
              >
                <span>Wishlist</span>
              </Link>
              <Link 
                href="/account"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center space-x-2 text-zervia-700"
              >
                <span>Account Settings</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header; 