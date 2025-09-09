'use client';

import React, { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { cn } from "../../lib/utils";

interface PageWrapperProps {
  children: ReactNode;
  className?: string;
}

export function PageWrapper({ children, className }: PageWrapperProps) {
  const pathname = usePathname();
  const isHomePage = pathname === '/';
  const isDashboard = pathname.startsWith('/admin') || pathname.startsWith('/agent') || pathname.startsWith('/vendor') || pathname.startsWith('/customer');
  const isAdminRoute = pathname?.startsWith('/admin');
  const isAgentRoute = pathname?.startsWith('/agent');
  const isVendorRoute = pathname?.startsWith('/vendor');
  
  // Admin, agent, and vendor routes don't have global header so no top padding needed
  const shouldHideHeaderFooter = isAdminRoute || isAgentRoute || isVendorRoute;
  
  return (
    <main className={cn(
      'flex-grow',
      isHomePage 
        ? '' // No container or padding for homepage
        : isDashboard
        ? shouldHideHeaderFooter 
          ? '' // No padding for admin/agent/vendor dashboards (no header to account for)
          : 'py-6 md:py-10 pt-20' // Vertical padding for customer dashboard (has header)
        : 'container px-4 sm:px-6 lg:px-8 py-6 md:py-10 pt-20', // Container and padding for other pages
      className
    )}>
      {children}
    </main>
  );
} 