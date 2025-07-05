'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  Home,
  Package,
  User2,
  Menu,
  X,
  ChevronDown,
} from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { toast } from 'sonner';

interface AgentLayoutProps {
  children: React.ReactNode;
  agentData: {
    name: string;
    email?: string;
  };
}

export default function AgentLayout({ children, agentData }: AgentLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const navItems = [
    { name: 'Dashboard', href: '/agent/dashboard', icon: Home },
    { name: 'Orders', href: '/agent/orders', icon: Package },
    { name: 'Profile', href: '/agent/profile', icon: User2 },
  ];

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const toggleProfileMenu = () => setIsProfileMenuOpen(!isProfileMenuOpen);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast.success('Signed out successfully');
      router.push('/');
    } catch (e) {
      console.error(e);
      toast.error('Error signing out');
    }
  };

  // Avatar initial
  const initial = agentData.name?.charAt(0).toUpperCase() || 'A';

  const renderNavLinks = () => (
    <nav className="space-y-1 mt-6">
      {navItems.map((item) => {
        const isActive = pathname?.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              isActive
                ? 'bg-zervia-600 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <item.icon size={18} className="mr-2" />
            {item.name}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className="hidden md:flex md:flex-col w-64 bg-white border-r pt-16">
        <div className="flex items-center justify-center h-16 border-b">
          <span className="text-lg font-semibold text-zervia-700">Zervia Agent</span>
        </div>
        <div className="p-4 flex flex-col flex-1 overflow-y-auto">
          {renderNavLinks()}
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-25 z-30 md:hidden"
          onClick={toggleMobileMenu}
        />
      )}
      {/* Mobile Sidebar */}
      <div
        className={`fixed top-16 bottom-0 left-0 w-64 bg-white z-40 transform transition-transform duration-300 ease-in-out ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        } md:hidden overflow-y-auto`}
      >
        <div className="p-4 border-b flex justify-between items-center">
          <span className="text-lg font-semibold text-zervia-700">Zervia Agent</span>
          <button onClick={toggleMobileMenu} className="text-gray-500">
            <X size={20} />
          </button>
        </div>
        <div className="p-4">
          {renderNavLinks()}
        </div>
      </div>

      {/* Main content area */}
      <div className="flex flex-col flex-1 min-h-screen">
        {/* Top bar */}
        <header className="sticky top-16 z-10 bg-white shadow-sm border-b">
          <div className="flex items-center justify-between px-4 md:px-6 h-16">
            <button className="md:hidden text-gray-600" onClick={toggleMobileMenu}>
              <Menu size={24} />
            </button>
            <h1 className="text-lg font-medium">Agent Dashboard</h1>
            {/* Profile dropdown */}
            <div className="relative">
              <button
                className="flex items-center text-sm focus:outline-none"
                onClick={toggleProfileMenu}
              >
                <div className="w-8 h-8 rounded-full bg-zervia-100 flex items-center justify-center text-zervia-600 mr-1">
                  {initial}
                </div>
                <ChevronDown size={16} className="text-gray-500 hidden md:block" />
              </button>
              {isProfileMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-md overflow-hidden z-20">
                  <Link
                    href="/agent/profile"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setIsProfileMenuOpen(false)}
                  >
                    Your Profile
                  </Link>
                  <button
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      handleSignOut();
                    }}
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 md:p-6 bg-gray-50 pt-4 md:pt-6">{children}</main>
      </div>
    </div>
  );
} 