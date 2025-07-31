"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User } from 'lucide-react';
import { getUserDashboardUrl } from '@/lib/client/user-role';

interface AccountButtonProps {
  className?: string;
}

export const AccountButton: React.FC<AccountButtonProps> = ({ className = '' }) => {
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);

  const handleAccountClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (isNavigating) return; // Prevent multiple clicks during navigation
    
    setIsNavigating(true);
    
    try {
      const dashboardUrl = await getUserDashboardUrl();
      router.push(dashboardUrl);
    } catch (error) {
      console.error('Error navigating to dashboard:', error);
      // Fallback to the original account page if there's an error
      router.push('/account');
    } finally {
      setIsNavigating(false);
    }
  };

  return (
    <button
      onClick={handleAccountClick}
      disabled={isNavigating}
      className={`p-2 rounded-full hover:bg-zervia-50 transition-colors ${className} ${
        isNavigating ? 'opacity-50 cursor-not-allowed' : ''
      }`}
      aria-label="Go to account dashboard"
    >
      <User className="h-5 w-5" />
    </button>
  );
};
