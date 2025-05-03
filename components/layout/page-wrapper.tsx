'use client';

import React from 'react';
import { usePathname } from 'next/navigation';

interface PageWrapperProps {
  children: React.ReactNode;
}

export default function PageWrapper({ children }: PageWrapperProps) {
  const pathname = usePathname();
  const isHomePage = pathname === '/';
  
  return (
    <main className={`flex-grow ${isHomePage ? '' : 'pt-20'}`}>
      {children}
    </main>
  );
} 