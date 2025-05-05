'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { 
  Home, 
  Package, 
  ShoppingBag, 
  BarChart2, 
  Settings, 
  LogOut,
  Menu,
  X,
  Plus,
  ChevronDown
} from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { toast } from 'sonner';
import { NotificationCenter } from '../notifications/notification-center';

interface VendorLayoutProps {
  children: React.ReactNode;
}

export default function VendorLayout({ children }: VendorLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  
  const navItems = [
    { name: 'Dashboard', href: '/vendor/dashboard', icon: Home },
    { name: 'Products', href: '/vendor/products', icon: ShoppingBag },
    { name: 'Orders', href: '/vendor/orders', icon: Package },
    { name: 'Analytics', href: '/vendor/analytics', icon: BarChart2 },
    { name: 'Settings', href: '/vendor/settings', icon: Settings },
  ];
  
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };
  
  const toggleProfileMenu = () => {
    setIsProfileMenuOpen(!isProfileMenuOpen);
  };

  const handleSignOut = async () => {
    try {
      // Sign out from Supabase
      await supabase.auth.signOut();
      
      // Clear any local storage items
      localStorage.removeItem("user");
      
      toast.success("You have been signed out successfully");
      
      // Redirect to home page
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error("Error signing out. Please try again.");
      
      // If there's an error, still try to redirect to home
      router.push('/');
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="px-4 md:px-6 py-2 flex items-center justify-between">
          {/* Left: Logo & Mobile Menu Button */}
          <div className="flex items-center">
            <button 
              className="md:hidden mr-4 text-gray-500"
              onClick={toggleMobileMenu}
            >
              <Menu size={24} />
            </button>
            <Link href="/vendor/dashboard" className="text-xl font-bold text-zervia-900">
              Zervia Vendor
            </Link>
          </div>
          
          {/* Right: Actions */}
          <div className="flex items-center space-x-3">
            {/* Add Product Button */}
            <Link 
              href="/vendor/products/new" 
              className="hidden md:flex items-center text-sm bg-zervia-600 text-white px-4 py-2 rounded-md hover:bg-zervia-700"
            >
              <Plus size={16} className="mr-1" /> Add Product
            </Link>
            
            {/* Notifications */}
            <NotificationCenter />
            
            {/* Profile Menu */}
            <div className="relative">
              <button 
                className="flex items-center text-sm rounded-full focus:outline-none"
                onClick={toggleProfileMenu}
              >
                <div className="w-8 h-8 rounded-full bg-zervia-100 flex items-center justify-center text-zervia-600 mr-1">
                  E
                </div>
                <div className="hidden md:block text-left mr-1">
                  <div className="text-sm font-medium">Emporium Elegance</div>
                </div>
                <ChevronDown size={16} className="hidden md:block text-gray-500" />
              </button>
              
              {/* Profile Dropdown */}
              {isProfileMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white shadow-lg rounded-md overflow-hidden z-20">
                  <div className="p-4 border-b">
                    <p className="font-medium">Emporium Elegance</p>
                    <p className="text-sm text-gray-500">vendor@example.com</p>
                  </div>
                  <div className="py-1">
                    <Link 
                      href="/vendor/profile" 
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsProfileMenuOpen(false)}
                    >
                      Your Profile
                    </Link>
                    <Link 
                      href="/vendor/settings" 
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsProfileMenuOpen(false)}
                    >
                      Settings
                    </Link>
                    <button 
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        handleSignOut();
                      }}
                    >
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-25 z-30 md:hidden" 
          onClick={toggleMobileMenu}
        />
      )}
      
      {/* Mobile Sidebar */}
      <div 
        className={`fixed top-0 bottom-0 left-0 w-64 bg-white z-40 transform transition-transform duration-300 ease-in-out ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        } md:hidden overflow-y-auto`}
      >
        <div className="p-4 border-b flex justify-between items-center">
          <Link href="/vendor/dashboard" className="text-xl font-bold text-zervia-900">
            Zervia Vendor
          </Link>
          <button 
            onClick={toggleMobileMenu}
            className="text-gray-500"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-4 border-b">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-zervia-100 flex items-center justify-center text-zervia-600">
              E
            </div>
            <div>
              <p className="font-medium">Emporium Elegance</p>
              <p className="text-xs text-gray-500">vendor@example.com</p>
            </div>
          </div>
        </div>
        
        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center p-2 text-sm font-medium rounded-md ${
                  isActive
                    ? 'bg-zervia-50 text-zervia-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <item.icon
                  className={`mr-3 h-5 w-5 ${
                    isActive ? 'text-zervia-500' : 'text-gray-400'
                  }`}
                />
                {item.name}
              </Link>
            );
          })}
        </nav>
        
        <div className="p-4 border-t mt-auto">
          <button
            className="flex items-center p-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900 w-full"
            onClick={() => {
              setIsMobileMenuOpen(false);
              handleSignOut();
            }}
          >
            <LogOut className="mr-3 h-5 w-5 text-gray-400" />
            Sign Out
          </button>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex">
        {/* Desktop Sidebar */}
        <div className="hidden md:block w-64 bg-white min-h-screen shadow-sm">
          <div className="p-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-zervia-100 flex items-center justify-center text-zervia-600">
                E
              </div>
              <div>
                <p className="font-medium">Emporium Elegance</p>
                <p className="text-xs text-gray-500">vendor@example.com</p>
              </div>
            </div>
          </div>
          
          <nav className="px-4 py-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-3 py-2 my-1 text-sm font-medium rounded-md ${
                    isActive
                      ? 'bg-zervia-50 text-zervia-600'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <item.icon
                    className={`mr-3 h-5 w-5 ${
                      isActive ? 'text-zervia-500' : 'text-gray-400'
                    }`}
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>
          
          <div className="mt-auto p-4 border-t absolute bottom-0 w-full">
            <button
              className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900 w-full"
              onClick={handleSignOut}
            >
              <LogOut className="mr-3 h-5 w-5 text-gray-400" />
              Sign Out
            </button>
          </div>
        </div>
        
        {/* Main Content Area */}
        <div className="flex-1 min-h-screen">
          <main className="p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
} 