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
  
  return (
    <main className={cn(
      'flex-grow',
      isHomePage 
        ? '' // No container or padding for homepage
        : isDashboard
        ? 'py-6 md:py-10 pt-20' // Vertical padding only for dashboards
        : 'container px-4 sm:px-6 lg:px-8 py-6 md:py-10 pt-20', // Container and padding for other pages
      className
    )}>
      {children}
    </main>
  );
} 