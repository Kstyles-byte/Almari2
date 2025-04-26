import React from 'react';
import VendorLayout from '@/components/layout/vendor-layout';

export default function VendorRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <VendorLayout>{children}</VendorLayout>;
} 