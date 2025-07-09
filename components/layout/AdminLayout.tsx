"use client";

import React, { ReactNode, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';
import {
  Users,
  ShoppingBag,
  Package,
  Settings,
  ImageIcon,
  LayoutDashboard,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { toast } from 'sonner';

interface AdminLayoutProps {
  children: ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClientComponentClient();

  const navItems = [
    {
      title: 'Dashboard',
      href: '/admin',
      icon: <LayoutDashboard className="h-5 w-5" />
    },
    {
      title: 'Content',
      href: '/admin/content',
      icon: <ImageIcon className="h-5 w-5" />
    },
    {
      title: 'Products',
      href: '/admin/products',
      icon: <Package className="h-5 w-5" />
    },
    {
      title: 'Orders',
      href: '/admin/orders',
      icon: <ShoppingBag className="h-5 w-5" />
    },
    {
      title: 'Users',
      href: '/admin/users',
      icon: <Users className="h-5 w-5" />
    },
    {
      title: 'Settings',
      href: '/admin/settings',
      icon: <Settings className="h-5 w-5" />
    },
  ];

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
      {/* Mobile sidebar toggle */}
      <button
        type="button"
        className="fixed top-20 left-4 z-50 md:hidden p-2 rounded-md bg-zervia-600 text-white"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-16 left-0 z-40 w-64 h-[calc(100vh-4rem)] transition-transform bg-white border-r border-gray-200 shadow-md",
          sidebarOpen ? "transform-none" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="h-full px-3 py-4 flex flex-col justify-between">
          <div>
            <div className="mb-6 px-3 py-4">
              <h1 className="text-xl font-bold text-zervia-700">Zervia Admin</h1>
            </div>
            <nav className="space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center px-3 py-2 text-sm font-medium rounded-md",
                    pathname === item.href
                      ? "bg-zervia-100 text-zervia-700"
                      : "text-gray-600 hover:bg-gray-100 hover:text-zervia-700"
                  )}
                >
                  {item.icon}
                  <span className="ml-3">{item.title}</span>
                </Link>
              ))}
            </nav>
          </div>
          <div className="mt-6 px-3">
            <Button 
              variant="outline" 
              className="w-full flex items-center text-gray-700"
              onClick={handleSignOut}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="md:ml-64 pt-20 p-4 md:p-8">
        {children}
      </div>
    </div>
  );
};

export default AdminLayout;