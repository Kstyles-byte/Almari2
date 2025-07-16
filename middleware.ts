import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
// Import the server client to query the public User table
// import { createClient } from '@/lib/supabase/server' 

// Define paths that REQUIRE authentication
const protectedPaths = ['/admin', '/vendor', '/agent', '/account', '/customer']; // /cart removed to allow guest

// Define paths that are explicitly public (like auth pages) even if logic changes
// const publicAuthPaths = ['/login', '/signup', '/auth/confirm', '/error']; // We might not strictly need this if logic below works

// Define paths that should be exempted from authentication even though they start with a protected path
const exemptPaths = ['/checkout/complete', '/checkout/thank-you'];

// Function to check if a path is protected (match whole segment, not prefix like "/vendors")
function isProtectedRoute(pathname: string): boolean {
  // First check if it's in the exempt list
  if (exemptPaths.some(path => pathname.startsWith(path))) {
    return false;
  }

  // Protected if pathname matches exactly the protected path OR starts with it followed by a slash
  return protectedPaths.some(path =>
    pathname === path || pathname.startsWith(`${path}/`)
  );
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Create Supabase client configured to use cookies
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          // If the cookie is updated, update the request and response cookies
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          // If the cookie is removed, update the request and response cookies
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  // Refresh session if expired - important!
  // This also handles reading the session internally
  const { data: { session } } = await supabase.auth.getSession();

  // Get user from the refreshed session (if any)
  const user = session?.user;

  // Get URL path
  const { pathname } = request.nextUrl;

  // Check if the path is a protected route
  const isProtected = isProtectedRoute(pathname);

  // --- Authentication & Authorization Logic ---

  // 1. If the route is protected and the user is NOT logged in, redirect to login
  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('message', 'Please log in to access this page.');
    console.log('[Middleware] Redirecting unauthenticated user from protected route:', pathname);
    return NextResponse.redirect(url);
  }

  // 2. If the route is protected and the user IS logged in, perform RBAC checks
  if (isProtected && user) {
    try {
      // Query the public User table to get the role
      // Note: This assumes you have a 'User' table with a 'role' column and FK to auth.users.id
      const { data: userData, error: userError } = await supabase
        .from('User') // Use the exact table name
        .select('role')
        .eq('id', user.id)
        .single();

      if (userError) {
        console.error('[Middleware] Error fetching user role:', userError.message);
        // Allow access but log error, or redirect to a generic error page
        // For now, let's allow access but this should be reviewed
        console.warn('[Middleware] Allowing access despite role fetch error for user:', user.id);
        // Optional: Redirect to error page
        // const url = request.nextUrl.clone();
        // url.pathname = '/error';
        // url.searchParams.set('message', 'Error checking user permissions.');
        // return NextResponse.redirect(url);
      } else {
        const userRole = userData?.role;
        console.log(`[Middleware] User: ${user.email}, Role: ${userRole}, Accessing Protected Path: ${pathname}`);

        // RBAC: Redirect if user role doesn't grant access to the specific protected path
        if (pathname.startsWith('/admin') && userRole !== 'ADMIN') {
          console.log('[Middleware] Redirecting non-admin from /admin');
          return NextResponse.redirect(new URL('/', request.url)); // Redirect to home or an 'unauthorized' page
        }
        if (pathname.startsWith('/vendor') && userRole !== 'VENDOR' && userRole !== 'ADMIN') {
          console.log('[Middleware] Redirecting non-vendor/admin from /vendor');
          return NextResponse.redirect(new URL('/', request.url));
        }
        if (pathname.startsWith('/agent') && userRole !== 'AGENT' && userRole !== 'ADMIN') {
          console.log('[Middleware] Redirecting non-agent/admin from /agent');
          return NextResponse.redirect(new URL('/', request.url));
        }
        // Customer route check (ensure any logged-in user isn't blocked from general account/customer pages if RBAC allows)
        // This check might be redundant if customer pages are implicitly allowed for CUSTOMER role by not having specific blocks
        // if (pathname.startsWith('/customer') && userRole !== 'CUSTOMER' && userRole !== 'ADMIN') { // Example check
        //   console.log('[Middleware] Redirecting non-customer/admin from /customer');
        //   return NextResponse.redirect(new URL('/', request.url));
        // }
      }

    } catch (e) {
      console.error('[Middleware] Exception during RBAC check:', e);
      // Handle unexpected errors during RBAC
      const url = request.nextUrl.clone();
      url.pathname = '/error';
      url.searchParams.set('message', 'An unexpected error occurred while checking permissions.');
      return NextResponse.redirect(url);
    }
  }

  // 3. If the route is NOT protected, or if it IS protected and the user IS logged in AND passed RBAC checks,
  //    allow the request to proceed.
  console.log(`[Middleware] Allowing access to ${pathname} for ${user ? user.email : 'guest'}`);
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    // Include specific API routes if needed, but the general pattern usually covers them
    // '/api/:path*',
  ],
} 