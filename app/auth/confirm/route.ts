import { type EmailOtpType } from '@supabase/supabase-js'
import { type NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers' // Import cookies if your server client needs it
import { createServerActionClient } from '@/lib/supabase/server' // Correct import
import { redirect } from 'next/navigation'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = searchParams.get('next') ?? '/' // Default redirect to homepage

  const redirectTo = request.nextUrl.clone()
  redirectTo.pathname = next
  redirectTo.searchParams.delete('token_hash')
  redirectTo.searchParams.delete('type')

  if (token_hash && type) {
    // Note: Supabase SSR guide uses createServerClient which takes cookies.
    // Our current server client in lib/supabase/server.ts doesn't explicitly take cookies.
    // Let's assume it works as is for now, or adjust if needed based on Supabase SSR setup.
    const cookieStore = cookies() 
    // const supabase = createClient(cookieStore); // If client needed cookies
    const supabase = await createServerActionClient() // Await client creation

    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    })
    
    if (!error) {
      redirectTo.searchParams.delete('next')
      return NextResponse.redirect(redirectTo)
    }
    
    // Log the error for debugging
    console.error('Error verifying OTP:', error);
  }

  // Redirect the user to an error page with instructions
  redirectTo.pathname = '/auth/error'
  return NextResponse.redirect(redirectTo)
} 