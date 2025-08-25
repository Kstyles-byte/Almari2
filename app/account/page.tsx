import { redirect } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Add dynamic export configuration
export const dynamic = 'force-dynamic';

export default async function AccountRedirectPage() {
  try {
    // Create Supabase client using SSR helper
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, // Use ANON key here as we're just getting the user
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing user sessions.
            }
          },
        },
      }
    );

    // Get user session directly using the Supabase client
    const { data: { user } } = await supabase.auth.getUser();

    // If still no user after checking, redirect to login
    if (!user) {
      console.log('AccountRedirectPage: No user session found, redirecting to login.');
      return redirect('/login?message=Your+session+may+have+expired.+Please+log+in+again.');
    }

    // Get user role from the custom User table (using Service Role Key for this specific query)
    const cookieStoreAdmin = await cookies();
    const supabaseAdmin = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!, // Use SERVICE key to read User table
      {
        cookies: {
          getAll() {
            return cookieStoreAdmin.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStoreAdmin.set(name, value, options)
              );
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing user sessions.
            }
          },
        },
      }
    );
    
    const { data: userData, error: userError } = await supabaseAdmin
        .from('User')
        .select('role')
        .eq('id', user.id)
        .single();

    if (userError) {
        console.error("Error fetching user role in AccountRedirectPage:", userError.message);
        // Decide how to handle - maybe redirect to a generic error page or customer dashboard?
        return redirect('/login?message=Error+retrieving+user+role.+Please+log+in+again.');
    }

    // Determine redirect based on user role
    const role = userData?.role?.toLowerCase() || 'customer';
    console.log(`AccountRedirectPage: User ${user.email} has role ${role}, redirecting...`);

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
  } catch (error: unknown) { // Use unknown for better type safety
    // Check if the error is the specific Next.js redirect error by checking its digest
    if (error && typeof error === 'object' && 'digest' in error && 
        typeof (error as { digest?: string }).digest === 'string' && 
        (error as { digest: string }).digest.startsWith('NEXT_REDIRECT')) {
      throw error; // Re-throw the error so Next.js can handle the redirect
    }
    // Handle other unexpected errors
    console.error('Unexpected error in account redirect page:', error);
    return redirect('/login?message=An+unexpected+authentication+error+occurred.+Please+log+in+again.');
  }
} 