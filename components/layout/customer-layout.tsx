'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Home, 
  Package, 
  Heart, 
  User, 
  LogOut, 
  ShoppingBag, 
  Settings, 
  Menu, 
  X 
} from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { toast } from 'sonner';

interface CustomerLayoutProps {
  children: React.ReactNode;
}

export default function CustomerLayout({ children }: CustomerLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [userName, setUserName] = useState('Customer');
  const [userEmail, setUserEmail] = useState('');
  const supabase = createClientComponentClient();
  
  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const user = session.user;
        setUserEmail(user.email || '');
        
        const { data: userData, error: userError } = await supabase
          .from('User')
          .select('name')
          .eq('id', user.id)
          .single();
          
        let displayName = 'Customer';
        if (userData?.name) {
          displayName = userData.name;
        } else if (user.user_metadata?.name) {
          displayName = user.user_metadata.name;
        } else if (user.user_metadata?.full_name) {
          displayName = user.user_metadata.full_name;
        } else if (user.email) {
          displayName = user.email.split('@')[0];
        }
        setUserName(displayName);
      } else {
        setUserName('Customer');
        setUserEmail('');
      }
    };

    fetchUserData();
  }, [supabase]);
  
  const navItems = [
    { name: 'Dashboard', href: '/customer/dashboard', icon: Home },
    { name: 'Orders', href: '/customer/orders', icon: Package },
    { name: 'Wishlist', href: '/customer/wishlist', icon: Heart },
    { name: 'Profile', href: '/customer/profile', icon: User },
    { name: 'Settings', href: '/customer/settings', icon: Settings },
  ];
  
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
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
      {/* Mobile Header */}
      <div className="md:hidden bg-white p-4 border-b shadow-sm flex justify-between items-center">
        <Link href="/" className="text-xl font-bold text-zervia-900">Zervia</Link>
        <button 
          onClick={toggleMobileMenu}
          className="p-2 rounded-md text-gray-500 hover:bg-gray-100"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
      
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-25 z-40 md:hidden" onClick={toggleMobileMenu} />
      )}
      
      {/* Mobile Sidebar */}
      <div 
        className={`fixed top-0 left-0 bottom-0 w-64 bg-white z-50 transform transition-transform duration-300 ease-in-out ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        } md:hidden overflow-y-auto`}
      >
        <div className="p-4 border-b flex justify-between items-center">
          <Link href="/" className="text-xl font-bold text-zervia-900">Zervia</Link>
          <button 
            onClick={toggleMobileMenu}
            className="p-2 rounded-md text-gray-500 hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="py-4">
          <div className="px-4 py-2 mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-zervia-100 flex items-center justify-center text-zervia-600">
                <User size={20} />
              </div>
              <div>
                <p className="font-medium">{userName}</p>
                <p className="text-sm text-gray-500">{userEmail}</p>
              </div>
            </div>
          </div>
          
          <nav className="space-y-1 px-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-2 py-2 text-base font-medium rounded-md ${
                    isActive
                      ? 'bg-zervia-50 text-zervia-600'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <item.icon
                    className={`mr-3 h-5 w-5 ${
                      isActive ? 'text-zervia-500' : 'text-gray-400 group-hover:text-gray-500'
                    }`}
                  />
                  {item.name}
                </Link>
              );
            })}
            
            <div className="pt-4 mt-4 border-t border-gray-200">
              <Link
                href="/"
                className="group flex items-center px-2 py-2 text-base font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <ShoppingBag className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
                Back to Shop
              </Link>
              
              <button
                onClick={handleSignOut}
                className="w-full group flex items-center px-2 py-2 text-base font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              >
                <LogOut className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
                Sign Out
              </button>
            </div>
          </nav>
        </div>
      </div>
      
      {/* Desktop Layout */}
      <div className="hidden md:flex">
        {/* Desktop Sidebar */}
        <div className="w-64 bg-white h-screen p-4 shadow-sm flex flex-col fixed">
          <div className="mb-8 h-8"></div>
          
          <div className="mb-8">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-zervia-100 flex items-center justify-center text-zervia-600">
                <User size={20} />
              </div>
              <div>
                <p className="font-medium">{userName}</p>
                <p className="text-sm text-gray-500">{userEmail}</p>
              </div>
            </div>
          </div>
          
          <nav className="space-y-1 flex-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                    isActive
                      ? 'bg-zervia-50 text-zervia-600'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <item.icon
                    className={`mr-3 h-5 w-5 ${
                      isActive ? 'text-zervia-500' : 'text-gray-400 group-hover:text-gray-500'
                    }`}
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>
          
          <div className="pt-4 mt-4 border-t border-gray-200">
            <Link
              href="/"
              className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            >
              <ShoppingBag className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
              Back to Shop
            </Link>
            
            <button
              onClick={handleSignOut}
              className="w-full text-left group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            >
              <LogOut className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
              Sign Out
            </button>
          </div>
        </div>
        
        {/* Desktop Main Content */}
        <div className="ml-64 w-full">
          <header className="bg-white shadow-sm py-4 px-8">
            <h1 className="text-lg font-medium text-zervia-900">My Account</h1>
          </header>
          <main className="p-6">
            {children}
          </main>
        </div>
      </div>
      
      {/* Mobile Main Content */}
      <div className="md:hidden">
        <main className="p-4">
          {children}
        </main>
      </div>
    </div>
  );
} 