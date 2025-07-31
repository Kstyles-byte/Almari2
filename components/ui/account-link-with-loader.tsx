"use client";

import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface AccountLinkWithLoaderProps {
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
}

export const AccountLinkWithLoader: React.FC<AccountLinkWithLoaderProps> = ({ 
  className = '', 
  children,
  onClick 
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Call the onClick handler (like closing mobile menu)
    onClick?.();
    
    // Navigate to dashboard
    router.push('/dashboard');
    
    // Reset loading state after a short delay (in case redirect fails)
    setTimeout(() => {
      setIsLoading(false);
    }, 5000);
  };

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className={`${className} ${isLoading ? 'opacity-75' : ''}`}
    >
      <div className="flex items-center space-x-2">
        {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
        {children}
      </div>
    </button>
  );
};
