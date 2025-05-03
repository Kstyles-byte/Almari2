"use client"

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation'; // Add this import
import { Search, ShoppingCart, User, Menu, X } from 'lucide-react';
import { Button } from '../ui/button';
import { Icons } from '../icons';
import { getCart } from '@/actions/cart'; // Import the getCart action

const Header = () => {
  const pathname = usePathname(); // Get current pathname
  const isHomePage = pathname === '/'; // Check if we're on home page
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [cartItemCount, setCartItemCount] = useState(0); // State for cart item count

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };
  
  // Function to fetch cart data
  const fetchCartItemCount = async () => {
    try {
      const cartData = await getCart();
      if (cartData.success && cartData.cart?.items) {
        // Calculate total items in cart (sum of quantities)
        const totalItems = cartData.cart.items.reduce((total: number, item: { quantity: number }) => total + item.quantity, 0);
        setCartItemCount(totalItems);
      } else {
        setCartItemCount(0);
      }
    } catch (error) {
      console.error("Error fetching cart count:", error);
      setCartItemCount(0);
    }
  };

  // Fetch cart count on initial load and set up event listener for cart updates
  useEffect(() => {
    fetchCartItemCount();
    
    // Listen for cart update events
    const handleCartUpdate = () => {
      fetchCartItemCount();
    };
    
    // Add event listener for custom cart-updated event
    window.addEventListener('cart-updated', handleCartUpdate);
    
    // Cleanup event listener on component unmount
    return () => {
      window.removeEventListener('cart-updated', handleCartUpdate);
    };
  }, []);
  
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
      className={`fixed top-0 left-0 w-full z-40 transition-all duration-300 ${
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
            <button 
              className={`p-2 rounded-full hover:bg-zervia-50 transition-colors ${
                (isHomePage && !isScrolled) ? "text-white" : "text-zervia-900"
              }`}
            >
              <Search className="h-5 w-5" />
            </button>
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

      {/* Mobile Menu */}
      <div className={`
        fixed inset-0 bg-white z-40 transform transition-transform duration-300 ease-in-out md:hidden
        ${mobileMenuOpen ? "translate-x-0" : "translate-x-full"}
      `}>
        <div className="container mx-auto px-4 py-20">
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