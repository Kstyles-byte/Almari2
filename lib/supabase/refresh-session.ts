import { createServerActionClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

/**
 * A utility function to refresh the Supabase session from server actions
 * This can be called before performing operations that require authentication
 * to ensure the session is fresh.
 */
export async function refreshSession() {
  try {
    // Create a Supabase client using the createServerActionClient helper
    // This automatically handles cookies for us
    const supabase = createServerActionClient({ cookies });
    
    // Get the current session
    const { data: sessionData } = await supabase.auth.getSession();
    
    if (!sessionData.session) {
      return { success: false, error: 'No active session found' };
    }
    
    // Try to refresh the session
    const { data, error } = await supabase.auth.refreshSession();
    
    if (error) {
      console.error('Failed to refresh session:', error.message);
      return { success: false, error: error.message };
    }
    
    if (data?.session) {
      return { success: true, session: data.session };
    }
    
    return { success: false, error: 'Session refresh failed' };
  } catch (error) {
    console.error('Exception during session refresh:', error);
    return { success: false, error: 'Unexpected error refreshing session' };
  }
} 