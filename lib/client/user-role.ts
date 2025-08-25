"use client";

import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

/**
 * Get the current user's role and return the appropriate dashboard URL
 */
export async function getUserDashboardUrl(): Promise<string> {
  try {
    const supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      // If no user, redirect to login
      return '/login?message=Please+log+in+to+access+your+account.';
    }

    // Get user role from the User table
    const { data: userData, error: roleError } = await supabase
      .from('User')
      .select('role')
      .eq('id', user.id)
      .single();

    if (roleError) {
      console.error('Error fetching user role:', roleError);
      // Default to customer dashboard if role can't be determined
      return '/customer/dashboard';
    }

    // Determine dashboard URL based on role
    const role = userData?.role?.toLowerCase() || 'customer';
    
    switch (role) {
      case 'admin':
        return '/admin';
      case 'vendor':
        return '/vendor/dashboard';
      case 'agent':
        return '/agent/dashboard';
      default:
        return '/customer/dashboard';
    }
  } catch (error) {
    console.error('Error determining user dashboard URL:', error);
    // Default to customer dashboard on error
    return '/customer/dashboard';
  }
}

/**
 * Navigate to the appropriate dashboard based on user role
 * This is a client-side function that can be used in components
 */
export async function navigateToUserDashboard(): Promise<string> {
  const dashboardUrl = await getUserDashboardUrl();
  return dashboardUrl;
}
