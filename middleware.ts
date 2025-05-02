import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
// Import the server client to query the public User table
// import { createClient } from '@/lib/supabase/server' 

// Define paths that REQUIRE authentication
const protectedPaths = ['/admin', '/vendor', '/agent', '/cart', '/checkout', '/account']; // Add other paths like '/profile' if needed

// Define paths that are explicitly public (like auth pages) even if logic changes
// const publicAuthPaths = ['/login', '/signup', '/auth/confirm', '/error']; // We might not strictly need this if logic below works

// Function to check if a path is protected (simple startsWith check)
function isProtectedRoute(pathname: string): boolean {
  return protectedPaths.some(path => pathname.startsWith(path));
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, // Use ANON key in middleware
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          // Create a new response to apply the cookie changes
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
           // Create a new response to apply the cookie changes
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

  // Get user information
  const { data: { user } } = await supabase.auth.getUser()

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
    console.log('Redirecting unauthenticated user from protected route:', pathname);
    return NextResponse.redirect(url);
  }

  // 2. If the route is protected and the user IS logged in, perform RBAC checks
  if (isProtected && user) {
    try {
      // Query the public User table to get the role
      const { data: userData, error: userError } = await supabase
        .from('User') // Use the exact table name
        .select('role')
        .eq('id', user.id)
        .single();

      if (userError) {
        console.error('Error fetching user role in middleware:', userError.message);
        const url = request.nextUrl.clone();
        url.pathname = '/error';
        url.searchParams.set('message', 'Error checking user permissions.');
        return NextResponse.redirect(url);
      }

      const userRole = userData?.role;
      console.log(`User: ${user.email}, Role: ${userRole}, Accessing Protected Path: ${pathname}`);

      // RBAC: Redirect if user role doesn't grant access to the specific protected path
      if (pathname.startsWith('/admin') && userRole !== 'ADMIN') {
        console.log('Redirecting non-admin from /admin');
        return NextResponse.redirect(new URL('/', request.url)); // Redirect to home or an 'unauthorized' page
      }
      if (pathname.startsWith('/vendor') && userRole !== 'VENDOR' && userRole !== 'ADMIN') {
        console.log('Redirecting non-vendor/admin from /vendor');
        return NextResponse.redirect(new URL('/', request.url));
      }
      if (pathname.startsWith('/agent') && userRole !== 'AGENT' && userRole !== 'ADMIN') {
        console.log('Redirecting non-agent/admin from /agent');
        return NextResponse.redirect(new URL('/', request.url));
      }
      // Add more specific RBAC checks if needed for other protected routes

    } catch (e) {
      console.error('Exception during RBAC check in middleware:', e);
      const url = request.nextUrl.clone();
      url.pathname = '/error';
      url.searchParams.set('message', 'An unexpected error occurred while checking permissions.');
      return NextResponse.redirect(url);
    }
  }

  // 3. If the route is NOT protected, allow access for everyone (guests and logged-in users).
  //    Also, if the route IS protected and the user IS logged in AND passed RBAC checks above, allow access.
  console.log(`Allowing access to ${pathname} for ${user ? user.email : 'guest'}`);
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