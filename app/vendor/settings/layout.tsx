"use client";

import { Toaster } from "../../../components/ui/toaster";

export default function VendorSettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toaster />
    </>
  );
} 