import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';
import { decodeSupabaseCookie } from './cookie-utils';

/**
 * Creates a Supabase client for Server Components and Server Actions.
 * Uses @supabase/ssr to handle cookie-based authentication.
 * Reads SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from environment variables.
 */
export async function createServerActionClient() {
  const cookieStore = await cookies();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  // Use the public anon key for user-scoped auth flows; the service role key
  // results in cookies that the browser client cannot parse ("base64-" prefix).
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  if (!supabaseUrl) {
    throw new Error('Missing env.SUPABASE_URL');
  }
  if (!supabaseKey) {
    throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }

  return createServerClient<Database>(
    supabaseUrl,
    supabaseKey, // Use Service Role Key for server actions
    {
      cookies: {
        get(name: string) {
          const raw = cookieStore.get(name)?.value;
          return decodeSupabaseCookie(raw);
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            // The `set` method needs modification if called from a Server Component
            // However, in Server Actions, it should work fine to set cookies for the response
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // Handle potential errors, e.g., if called from a context where cookies cannot be set
            console.error('Error setting cookie in Supabase client:', error);
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            // The `delete` method needs modification if called from a Server Component
             // However, in Server Actions, it should work fine to set cookies for the response
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {
             // Handle potential errors
            console.error('Error removing cookie in Supabase client:', error);
          }
        },
      },
      // Optional: Adjust auth options if needed, but defaults are usually fine for SSR
      // auth: {
      //   autoRefreshToken: true,
      //   persistSession: true,
      //   detectSessionInUrl: true
      // },
    }
  );
}

// Note: The createServiceClient or createClient functions from the previous version are removed 
// as this single function using @supabase/ssr should handle server-side needs.
// If a client specifically needing the ANON key on the server is required,
// a similar function can be created, swapping SUPABASE_SERVICE_ROLE_KEY 
// for NEXT_PUBLIC_SUPABASE_ANON_KEY. 