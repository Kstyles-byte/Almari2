"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUserDashboardUrl } from '@/lib/client/user-role';

interface AccountLinkProps {
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
}

export const AccountLink: React.FC<AccountLinkProps> = ({ 
  className = '', 
  children, 
  onClick 
}) => {
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);

  const handleAccountClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (isNavigating) return;
    
    setIsNavigating(true);
    
    try {
      const dashboardUrl = await getUserDashboardUrl();
      router.push(dashboardUrl);
      onClick?.(); // Call any additional onClick handler (like closing mobile menu)
    } catch (error) {
      console.error('Error navigating to dashboard:', error);
      router.push('/account');
      onClick?.();
    } finally {
      setIsNavigating(false);
    }
  };

  return (
    <button
      onClick={handleAccountClick}
      disabled={isNavigating}
      className={`${className} ${isNavigating ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {children}
    </button>
  );
};
