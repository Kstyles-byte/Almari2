"use client"

import React from 'react';
import Link from 'next/link';
import { Search, ShoppingCart, User, Menu } from 'lucide-react';
import { Button } from '../ui/button';

const Header = () => {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <span className="text-2xl font-bold text-zervia-600">Zervia</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/products" className="text-zervia-900 hover:text-zervia-600 transition-colors">
              Products
            </Link>
            <Link href="/category/women" className="text-zervia-900 hover:text-zervia-600 transition-colors">
              Women
            </Link>
            <Link href="/category/men" className="text-zervia-900 hover:text-zervia-600 transition-colors">
              Men
            </Link>
            <Link href="/category/accessories" className="text-zervia-900 hover:text-zervia-600 transition-colors">
              Accessories
            </Link>
            <Link href="/vendors" className="text-zervia-900 hover:text-zervia-600 transition-colors">
              Vendors
            </Link>
          </nav>

          {/* Search and Actions */}
          <div className="flex items-center space-x-4">
            <button className="p-2 text-zervia-900 hover:text-zervia-600 transition-colors">
              <Search className="h-5 w-5" />
            </button>
            <Link href="/cart" className="p-2 text-zervia-900 hover:text-zervia-600 transition-colors relative">
              <ShoppingCart className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 bg-zervia-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                3
              </span>
            </Link>
            <Link href="/account" className="p-2 text-zervia-900 hover:text-zervia-600 transition-colors">
              <User className="h-5 w-5" />
            </Link>
            <Button className="hidden md:flex">Sign In</Button>
            <button className="md:hidden p-2 text-zervia-900 hover:text-zervia-600 transition-colors">
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header; 