'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  Package, 
  ShoppingBag, 
  BarChart2, 
  Settings, 
  LogOut,
  Menu,
  X,
  Bell,
  Plus,
  ChevronDown
} from 'lucide-react';

interface VendorLayoutProps {
  children: React.ReactNode;
}

export default function VendorLayout({ children }: VendorLayoutProps) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
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
  
  const toggleNotifications = () => {
    setIsNotificationsOpen(!isNotificationsOpen);
    if (isProfileMenuOpen) setIsProfileMenuOpen(false);
  };
  
  const toggleProfileMenu = () => {
    setIsProfileMenuOpen(!isProfileMenuOpen);
    if (isNotificationsOpen) setIsNotificationsOpen(false);
  };
  
  // Mock notifications data
  const notifications = [
    { id: 1, title: 'New Order', message: 'You have received a new order (#1234)', time: '5 minutes ago' },
    { id: 2, title: 'Low Stock Alert', message: 'Product "Premium T-Shirt" is running low on stock', time: '1 hour ago' },
    { id: 3, title: 'Order Completed', message: 'Order #1230 has been delivered successfully', time: '3 hours ago' },
  ];
  
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
            <div className="relative">
              <button 
                className="p-2 rounded-full text-gray-500 hover:bg-gray-100 relative"
                onClick={toggleNotifications}
              >
                <Bell size={20} />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              
              {/* Notifications Dropdown */}
              {isNotificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white shadow-lg rounded-md overflow-hidden z-20">
                  <div className="p-4 border-b">
                    <h3 className="font-semibold text-zervia-900">Notifications</h3>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {notifications.length > 0 ? (
                      <div className="divide-y">
                        {notifications.map((notification) => (
                          <div key={notification.id} className="p-4 hover:bg-gray-50">
                            <h4 className="font-medium text-sm">{notification.title}</h4>
                            <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                            <p className="text-xs text-gray-400 mt-1">{notification.time}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 text-center text-gray-500">
                        No notifications
                      </div>
                    )}
                  </div>
                  <div className="p-2 border-t text-center">
                    <Link href="/vendor/notifications" className="text-sm text-zervia-600 hover:text-zervia-700">
                      View all notifications
                    </Link>
                  </div>
                </div>
              )}
            </div>
            
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
                    <Link 
                      href="/auth/signout" 
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsProfileMenuOpen(false)}
                    >
                      Sign out
                    </Link>
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
          <Link
            href="/auth/signout"
            className="flex items-center p-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <LogOut className="mr-3 h-5 w-5 text-gray-400" />
            Sign Out
          </Link>
        </div>
      </div>
      
      {/* Desktop Layout */}
      <div className="flex min-h-screen">
        {/* Desktop Sidebar */}
        <div className="hidden md:block w-64 bg-white border-r min-h-screen">
          <div className="p-4 space-y-1">
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
          </div>
          
          <div className="p-4 border-t mt-4">
            <div className="px-2 py-4 bg-zervia-50 rounded-lg">
              <h3 className="text-sm font-medium text-zervia-800 mb-2">Need Help?</h3>
              <p className="text-xs text-zervia-600 mb-3">
                Get support from our team or check out our vendor guides.
              </p>
              <Link 
                href="/vendor/support" 
                className="text-xs bg-white text-zervia-600 hover:bg-zervia-100 px-3 py-2 rounded border border-zervia-200 inline-flex items-center"
              >
                Contact Support
              </Link>
            </div>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="flex-1">
          <main className="p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
} 