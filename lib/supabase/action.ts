import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { CookieOptions } from '@supabase/ssr';
import { refreshSession } from './refresh-session';

/**
 * Creates a Supabase client for server actions with automatic session refresh capabilities.
 * @param {boolean} trySessionRefresh - Whether to try refreshing the session automatically (default: true)
 * @returns The Supabase client instance
 */
export async function createSupabaseServerActionClient(trySessionRefresh = true) {
  // Get cookie store (await it)
  const cookieStore = await cookies();

  // Create the client
  const client = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // Use Service Role Key for server actions
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          // Use the correct syntax for mutating cookies in server actions
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
           // Use the correct syntax for mutating cookies in server actions
          cookieStore.set({ name, value: '', ...options });
        },
      },
    }
  );

  // Try to refresh the session if requested
  if (trySessionRefresh) {
    try {
      // Check for existing session
      const { data: sessionData } = await client.auth.getSession();
      
      // If session exists but might be close to expiry, try refreshing it
      if (sessionData.session) {
        const expiresAt = sessionData.session.expires_at;
        
        // Check if expiresAt is defined before using it
        if (expiresAt !== undefined) {
          const currentTime = Math.floor(Date.now() / 1000); // Current time in seconds
          const timeUntilExpiry = expiresAt - currentTime;
          
          if (timeUntilExpiry < 1800) { // Less than 30 minutes (in seconds)
            console.log('Session expiring soon, attempting refresh...');
            await refreshSession();
            // Optional: Re-fetch session after refresh to ensure client has latest?
            // const { data: refreshedSessionData } = await client.auth.getSession();
            // if (!refreshedSessionData.session) console.warn("Session refresh attempt completed, but session still not found.");
          }
        } else {
          console.warn("Session expiry time (expires_at) is undefined, cannot check expiry.");
        }
      }
    } catch (error) {
      // Don't let refresh errors affect the client creation
      console.error('Error during automatic session refresh:', error);
    }
  }

  return client;
}

// Create a Supabase client for use in server actions
export async function createActionClient() {
  const cookieStore = await cookies();
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: '', ...options });
        },
      },
    }
  );
}

// Helper to get user session
export async function getActionSession() {
  const supabase = await createActionClient();
  const { data: { session } } = await supabase.auth.getSession();
  return session;
} 