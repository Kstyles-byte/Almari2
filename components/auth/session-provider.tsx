"use client";

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import { createRefreshClient } from '@/lib/supabase/refresh-client';

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClientComponentClient();
  const refreshClient = createRefreshClient();
  const router = useRouter();
  const { toast } = useToast();

  // Function to handle session refresh
  const handleSessionRefresh = async () => {
    try {
      // First, check if a session exists client-side
      const { data: { session }, error: getSessionError } = await supabase.auth.getSession();
      
      if (getSessionError) {
        console.error('Error checking session before refresh:', getSessionError.message);
        return; // Don't proceed if checking session failed
      }
      
      if (!session) {
        console.log('No active session found client-side. Skipping refresh attempt.');
        return; // Don't attempt refresh if no session exists
      }

      // If session exists, proceed with the refresh attempt
      console.log('Attempting to refresh session client-side...');
      const success = await refreshClient.refreshSession();
      
      if (!success) {
        console.log('Session refresh failed - user might need to re-login');
        // We don't automatically redirect to login here, as that would be disruptive
        // Instead, API calls will fail and trigger proper error handling
      } else {
        console.log('Session refreshed successfully');
      }
    } catch (e) {
      console.error('Error refreshing session:', e);
    }
  };

  useEffect(() => {
    // Set up auth state change listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        router.refresh();
      }
      setIsLoading(false);
    });

    // Initial session check
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsLoading(false);
      if (session) {
        // If we have a session, make sure it's fresh
        handleSessionRefresh();
      }
    };
    
    checkSession();

    // Set up refresh interval (every 10 minutes)
    const refreshInterval = setInterval(handleSessionRefresh, 10 * 60 * 1000);

    return () => {
      subscription.unsubscribe();
      clearInterval(refreshInterval);
    };
  }, [supabase, router]);

  return (
    <>
      {children}
    </>
  );
} 