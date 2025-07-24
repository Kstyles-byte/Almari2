"use client";
import { ReactNode, useEffect } from 'react';
import { useVendorOrdersSubscription } from '@/hooks/useVendorOrdersSubscription';

interface Props {
  children: ReactNode;
}

export default function VendorOrdersRealtimeProvider({ children }: Props) {
  // Kick off subscription once for anything under vendor area
  useVendorOrdersSubscription();

  // Debug: verify provider actually mounts in the browser
  useEffect(() => {
    console.log('[VendorOrdersRealtimeProvider] mounted');
  }, []);
  return <>{children}</>;
} 