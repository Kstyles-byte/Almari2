import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

/**
 * Creates a Supabase client for server components and server actions.
 * This implementation doesn't rely on cookies, making it simpler to use
 * but requires proper session handling elsewhere in the application.
 * 
 * @param {string} supabaseUrl - Optional custom Supabase URL
 * @param {string} supabaseKey - Optional custom Supabase key (service role or anon)
 * @returns Supabase client instance
 */
export function createClient(
  supabaseUrl?: string,
  supabaseKey?: string
) {
  // Use provided credentials or fall back to environment variables
  const url = supabaseUrl || process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = supabaseKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  
  if (!url || !key) {
    throw new Error('Supabase URL and key must be provided either as arguments or environment variables');
  }
  
  // Create and return the client
  return createSupabaseClient<Database>(url, key, {
    auth: {
      persistSession: false, // Don't persist session in browser
      autoRefreshToken: false, // Don't auto refresh token
    }
  });
}

/**
 * For protected admin routes or operations requiring service role access,
 * this creates a client with the service role key that bypasses RLS.
 * 
 * IMPORTANT: Only use this on the server and for admin operations!
 */
export function createServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Supabase URL and service role key must be provided as environment variables');
  }
  
  return createSupabaseClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    }
  });
} 