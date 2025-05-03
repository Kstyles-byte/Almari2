import CustomerLayout from '@/components/layout/customer-layout';
import React from 'react';
// import { auth } from '@/auth'; // Remove auth import
import { redirect } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const metadata = {
  title: 'My Account | Zervia',
  description: 'Manage your Zervia account, orders, and profile',
};

export default async function CustomerAccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    // Create Supabase client using SSR helper
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, // ANON key for checking auth
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

    // Check authentication directly via Supabase client
    const { data: { user } } = await supabase.auth.getUser();
  
    // If not authenticated, redirect to login
    if (!user) {
      console.log('CustomerAccountLayout: No user session, redirecting to login.');
      redirect('/login?callbackUrl=/customer/dashboard'); // Use return redirect if needed
    }

    // If authenticated, render the layout
    return (
      <CustomerLayout>{children}</CustomerLayout>
    );
    
  } catch (error: any) { // Catch potential errors, including redirect errors
     if (typeof error?.digest === 'string' && error.digest.startsWith('NEXT_REDIRECT')) {
      throw error; // Re-throw the redirect error
    }
    // Handle other unexpected errors
    console.error('Error in CustomerAccountLayout:', error);
    // Redirect to login or an error page in case of unexpected issues
    redirect('/login?callbackUrl=/customer/dashboard&message=An+error+occurred+loading+your+account.');
  }
} 