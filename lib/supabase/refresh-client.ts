'use client';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

/**
 * A simple client component helper for refreshing the Supabase session
 */
export function createRefreshClient() {
  const supabase = createClientComponentClient();
  
  /**
   * Refreshes the current session
   */
  const refreshSession = async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) {
        console.error('Failed to refresh session:', error.message);
        return false;
      }
      
      if (data.session) {
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Exception during session refresh:', error);
      return false;
    }
  };
  
  return { refreshSession };
} 