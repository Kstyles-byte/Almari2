'use client';

import { useState } from 'react';
import { useLoading } from '@/components/providers/LoadingProvider';

// Hook for managing different types of loading states in components
export function useCustomLoader() {
  const [isButtonLoading, setIsButtonLoading] = useState<Record<string, boolean>>({});
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [actionLoadingText, setActionLoadingText] = useState('');
  const { startLoading, stopLoading } = useLoading();
  
  // For page transitions
  const startPageLoading = (text?: string) => {
    startLoading(text);
  };
  
  const stopPageLoading = () => {
    stopLoading();
  };
  
  // For button loading states (can have multiple buttons in a component)
  const startButtonLoading = (buttonId: string) => {
    setIsButtonLoading(prev => ({ ...prev, [buttonId]: true }));
  };
  
  const stopButtonLoading = (buttonId: string) => {
    setIsButtonLoading(prev => ({ ...prev, [buttonId]: false }));
  };
  
  const isButtonLoadingById = (buttonId: string) => {
    return isButtonLoading[buttonId] || false;
  };
  
  // For actions that need a modal-like loader (adding to cart, processing payment, etc.)
  const startActionLoading = (text: string) => {
    setActionLoadingText(text);
    setIsActionLoading(true);
  };
  
  const stopActionLoading = () => {
    setIsActionLoading(false);
  };
  
  return {
    // Page transition loaders
    startPageLoading,
    stopPageLoading,
    
    // Button loaders
    startButtonLoading,
    stopButtonLoading,
    isButtonLoadingById,
    
    // Action loaders (modal-like)
    startActionLoading,
    stopActionLoading,
    isActionLoading,
    actionLoadingText
  };
} 