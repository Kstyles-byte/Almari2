"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { User, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface AccountButtonWithLoaderProps {
  className?: string;
}

export const AccountButtonWithLoader: React.FC<AccountButtonWithLoaderProps> = ({ 
  className = '' 
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
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
      className={`p-2 rounded-full hover:bg-zervia-50 transition-colors ${className} ${
        isLoading ? 'opacity-75' : ''
      }`}
      aria-label="Go to dashboard"
    >
      {isLoading ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <User className="h-5 w-5" />
      )}
    </button>
  );
};
