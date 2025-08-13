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
  X,
  Percent,
  Shield,
  UserCog,
  Store,
  ChevronDown,
  DollarSign,
  RefreshCw,
  BarChart3,
  TrendingUp,
  FileText
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
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ 
    'Orders & Finance': true, 
    'Analytics': true, 
    'Users': true,
    'Store Management': true 
  });
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClientComponentClient();

  const navSections = [
    {
      header: null,
      items: [
        { title: 'Dashboard', href: '/admin', icon: <LayoutDashboard className="h-5 w-5" /> },
      ],
    },
    {
      header: 'Orders & Finance',
      items: [
        { title: 'Orders', href: '/admin/orders', icon: <ShoppingBag className="h-5 w-5" /> },
        { title: 'Payouts', href: '/admin/payouts', icon: <TrendingUp className="h-5 w-5" /> },
        { title: 'Refunds', href: '/admin/refunds', icon: <RefreshCw className="h-5 w-5" /> },
        { title: 'Returns', href: '/admin/returns', icon: <RefreshCw className="h-5 w-5" /> },
      ],
    },
    {
      header: 'Analytics',
      items: [
        { title: 'Refund Analytics', href: '/admin/analytics/refunds', icon: <BarChart3 className="h-4 w-4" /> },
        { title: 'Performance', href: '/admin/analytics/performance', icon: <TrendingUp className="h-4 w-4" /> },
      ],
    },
    {
      header: 'Users',
      items: [
        { title: 'Admins', href: '/admin/users?role=ADMIN', icon: <Shield className="h-4 w-4" /> },
        { title: 'Agents', href: '/admin/agents', icon: <UserCog className="h-4 w-4" /> },
        { title: 'Vendors', href: '/admin/vendors', icon: <Store className="h-4 w-4" /> },
        { title: 'Customers', href: '/admin/users?role=CUSTOMER', icon: <Users className="h-4 w-4" /> },
      ],
    },
    {
      header: 'Store Management',
      items: [
        { title: 'Products', href: '/admin/products', icon: <Package className="h-5 w-5" /> },
        { title: 'Content', href: '/admin/content', icon: <FileText className="h-5 w-5" /> },
        { title: 'Coupons', href: '/admin/coupons', icon: <Percent className="h-5 w-5" /> },
        { title: 'Settings', href: '/admin/settings', icon: <Settings className="h-5 w-5" /> },
      ],
    },
  ] as const;

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
          "fixed top-16 left-0 z-40 w-64 h-[calc(100vh-4rem)] transition-transform bg-white border-r border-gray-200 shadow-md overflow-y-auto",
          sidebarOpen ? "transform-none" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="h-full px-3 py-4 flex flex-col justify-between">
          <div>
            <div className="mb-6 px-3 py-4">
              <h1 className="text-xl font-bold text-zervia-700">Zervia Admin</h1>
            </div>
            <nav className="space-y-1">
              {navSections.map(section => {
                const open = section.header ? expanded[section.header] !== false : true;
                return (
                <div key={section.header ?? Math.random()} className="mb-2">
                  {section.header && (
                    <button
                      type="button"
                      onClick={() =>
                        setExpanded(prev => ({
                          ...prev,
                          [section.header as string]: !prev[section.header as string],
                        }))
                      }
                      className="flex w-full items-center justify-between px-3 py-1 text-xs font-semibold uppercase tracking-wider text-gray-500 hover:text-gray-700"
                    >
                      {section.header}
                      <ChevronDown
                        className={cn(
                          "h-3 w-3 transition-transform",
                          open ? "rotate-0" : "-rotate-90"
                        )}
                      />
                    </button>
                  )}
                  {open && section.items.map(item => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center px-3 py-2 text-sm font-medium rounded-md",
                        pathname === item.href.split('?')[0]
                          ? "bg-zervia-100 text-zervia-700"
                          : "text-gray-600 hover:bg-gray-100 hover:text-zervia-700"
                      )}
                    >
                      {item.icon}
                      <span className="ml-3">{item.title}</span>
                    </Link>
                  ))}
                </div>
              );})}
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
      <div className="md:ml-64 pt-20 py-4 md:py-8 px-4 md:px-8">
        {children}
      </div>
    </div>
  );
};

export default AdminLayout;