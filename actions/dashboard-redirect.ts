"use server";

import { redirect } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function redirectToDashboard() {
  try {
    // Create Supabase client using SSR helper
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: any) {
            cookieStore.set({ name, value: '', ...options });
          },
        },
      }
    );

    // Get user session directly using the Supabase client
    const { data: { user } } = await supabase.auth.getUser();

    // If no user, redirect to login
    if (!user) {
      console.log('Dashboard redirect: No user session found, redirecting to login.');
      return redirect('/login?callbackUrl=/account&message=Your+session+may+have+expired.+Please+log+in+again.');
    }

    // Get user role from the custom User table (using Service Role Key for this specific query)
    const cookieStoreAdmin = await cookies();
    const supabaseAdmin = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          get(name: string) { return cookieStoreAdmin.get(name)?.value; },
          set(name: string, value: string, options: any) { cookieStoreAdmin.set({ name, value, ...options }); },
          remove(name: string, options: any) { cookieStoreAdmin.set({ name, value: '', ...options }); },
        },
      }
    );
    
    const { data: userData, error: userError } = await supabaseAdmin
        .from('User')
        .select('role')
        .eq('id', user.id)
        .single();

    if (userError) {
        console.error("Error fetching user role in dashboard redirect:", userError.message);
        return redirect('/login?callbackUrl=/account&message=Error+retrieving+user+role.+Please+try+again.');
    }

    // Determine redirect based on user role
    const role = userData?.role?.toLowerCase() || 'customer';
    console.log(`Dashboard redirect: User ${user.email} has role ${role}, redirecting...`);

    if (role === 'admin') {
      return redirect('/admin');
    } else if (role === 'vendor') {
      return redirect('/vendor/dashboard');
    } else if (role === 'agent') {
      return redirect('/agent/dashboard');
    } else {
      // Default to customer dashboard
      return redirect('/customer/dashboard');
    }
  } catch (error: any) {
    // Check if the error is the specific Next.js redirect error
    if (typeof error?.digest === 'string' && error.digest.startsWith('NEXT_REDIRECT')) {
      throw error; // Re-throw the error so Next.js can handle the redirect
    }
    // Handle other unexpected errors
    console.error('Unexpected error in dashboard redirect:', error);
    return redirect('/login?callbackUrl=/account&message=An+unexpected+authentication+error+occurred.+Please+log+in+again.');
  }
}
