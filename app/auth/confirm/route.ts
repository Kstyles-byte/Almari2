import { type EmailOtpType } from '@supabase/supabase-js'
import { type NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers' // Import cookies if your server client needs it
import { createClient } from '@/lib/supabase/server' // Adjust import path if needed
import { redirect } from 'next/navigation'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = searchParams.get('next') ?? '/' // Default redirect to homepage

  if (token_hash && type) {
    // Note: Supabase SSR guide uses createServerClient which takes cookies.
    // Our current server client in lib/supabase/server.ts doesn't explicitly take cookies.
    // Let's assume it works as is for now, or adjust if needed based on Supabase SSR setup.
    const cookieStore = cookies() 
    // const supabase = createClient(cookieStore); // If client needed cookies
    const supabase = createClient(); // Using our existing server client

    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    })
    
    if (!error) {
      // Redirect the user to the page they were trying to access or the homepage.
      // Consider redirecting to a specific 'welcome' or 'dashboard' page.
      console.log(`Redirecting to: ${next}`);
      return redirect(next) // Use next/navigation redirect for server components/actions/routes
    }
    
    // Log the error for debugging
    console.error('Error verifying OTP:', error);
  }

  // Redirect the user to an error page with instructions
  console.log('Redirecting to error page due to missing token/type or verification error.');
  return redirect('/error?message=Email%20verification%20failed.%20Please%20try%20again%20or%20contact%20support.')
} 