'use client';

import dynamic from 'next/dynamic';
import React from 'react';

// Dynamically import the VendorApplicationForm, disabling SSR
const VendorApplicationForm = dynamic(
  () => import('@/components/forms/VendorApplicationForm').then(mod => mod.VendorApplicationForm),
  { 
    ssr: false, 
    loading: () => <p>Loading form...</p> // Optional loading state
  } 
);

export default function VendorFormLoader() {
  return <VendorApplicationForm />;
} 