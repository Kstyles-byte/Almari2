'use client';

import React, { createContext, useContext, useState, useEffect, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { PageTransitionLoader } from '../ui/loader';

interface LoadingContextType {
  isLoading: boolean;
  startLoading: (text?: string) => void;
  stopLoading: () => void;
  loadingText: string;
}

const LoadingContext = createContext<LoadingContextType>({
  isLoading: false,
  startLoading: () => {},
  stopLoading: () => {},
  loadingText: 'Loading'
});

export const useLoading = () => useContext(LoadingContext);

// Create an inner component to handle the navigation-aware loading logic
function NavigationAwareLoading({ 
  setIsLoading, 
  setLoadingText 
}: { 
  setIsLoading: (value: boolean) => void;
  setLoadingText: (value: string) => void;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Handle route changes
  useEffect(() => {
    setIsLoading(true);
    
    // Set appropriate loading text based on the route
    if (pathname.includes('/products')) {
      setLoadingText('Loading Products');
    } else if (pathname.includes('/cart')) {
      setLoadingText('Loading Cart');
    } else if (pathname.includes('/checkout')) {
      setLoadingText('Preparing Checkout');
    } else if (pathname.includes('/category')) {
      const category = pathname.split('/').pop() || 'Products';
      const formattedCategory = category.charAt(0).toUpperCase() + category.slice(1);
      setLoadingText(`Loading ${formattedCategory} Collection`);
    } else {
      setLoadingText('Loading');
    }
    
    // Short timeout to simulate loading and prevent flashes
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);
    
    return () => clearTimeout(timer);
  }, [pathname, searchParams, setIsLoading, setLoadingText]);

  return null; // This component doesn't render anything itself
}

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('Loading');

  const startLoading = (text = 'Loading') => {
    setLoadingText(text);
    setIsLoading(true);
  };

  const stopLoading = () => {
    setIsLoading(false);
  };

  return (
    <LoadingContext.Provider value={{ isLoading, startLoading, stopLoading, loadingText }}>
      {isLoading && <PageTransitionLoader text={loadingText} />}
      
      {/* Wrap the navigation-aware component in Suspense */}
      <Suspense fallback={null}>
        <NavigationAwareLoading 
          setIsLoading={setIsLoading}
          setLoadingText={setLoadingText}
        />
      </Suspense>
      
      {children}
    </LoadingContext.Provider>
  );
} 