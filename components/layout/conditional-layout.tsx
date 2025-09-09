'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Header from './header';
import Footer from './footer';

interface ConditionalLayoutProps {
  children: React.ReactNode;
}

export function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname();
  
  // Hide header and footer for admin, agent, and vendor dashboards
  const isAdminRoute = pathname?.startsWith('/admin');
  const isAgentRoute = pathname?.startsWith('/agent');
  const isVendorRoute = pathname?.startsWith('/vendor');
  
  const shouldHideHeaderFooter = isAdminRoute || isAgentRoute || isVendorRoute;

  return (
    <>
      {!shouldHideHeaderFooter && <Header />}
      {children}
      {!shouldHideHeaderFooter && <Footer />}
    </>
  );
}
