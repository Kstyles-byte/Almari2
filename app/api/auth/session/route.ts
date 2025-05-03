import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

/**
 * API endpoint to verify the authenticated session
 * This can be used to:
 * 1. Keep the session fresh during redirects
 * 2. Check authentication status from client components
 */
export async function GET() {
  try {
    console.log('Session refresh API called');
    
    // Get the session from Next Auth (this validates the session)
    const session = await auth();
    
    // Set cache control headers to prevent caching
    const headers = {
      'Cache-Control': 'no-store, max-age=0, must-revalidate'
    };
    
    // Return whether the user is authenticated via Next Auth
    if (session && session.user) {
      console.log('Next Auth session is valid for user');
      
      // Return minimal user information for security
      return NextResponse.json({
        authenticated: true,
        message: 'Session is valid',
        userId: session.user.id
      }, { headers });
    }
    
    // If no Next Auth session, try to check Supabase session as fallback
    try {
      const cookieStore = cookies();
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      if (supabaseUrl && supabaseKey) {
        // Create a Supabase client with cookie access for server components
        const supabase = createClient(
          supabaseUrl, 
          supabaseKey, 
          {
            auth: {
              persistSession: false,
            }
          }
        );
        
        // Try to get the session from Supabase directly
        const { data, error } = await supabase.auth.getSession();
        
        if (!error && data.session) {
          console.log('Supabase session found as fallback');
          return NextResponse.json({
            authenticated: true,
            message: 'Supabase session is valid',
            userId: data.session.user.id
          }, { headers });
        }
      }
    } catch (supabaseError) {
      console.error('Error checking Supabase session:', supabaseError);
      // Continue to return not authenticated
    }
    
    console.log('No valid session found');
    return NextResponse.json({
      authenticated: false,
      message: 'Not authenticated'
    }, { headers });
  } catch (error) {
    console.error('Error validating session:', error);
    
    return NextResponse.json({
      authenticated: false,
      message: 'Error checking authentication status',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, {
      status: 500,
      headers: {
        'Cache-Control': 'no-store, max-age=0, must-revalidate'
      }
    });
  }
} 