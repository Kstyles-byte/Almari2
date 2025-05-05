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
  
  return (
    <main className={cn(
      isHomePage 
        ? "" // No container or padding for homepage
        : "container py-6 md:py-10 pt-20", // Keep container and padding for other pages
      className
    )}>
      {children}
    </main>
  );
} 