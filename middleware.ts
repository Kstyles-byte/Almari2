import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
// Import the server client to query the public User table
// import { createClient } from '@/lib/supabase/server' 

// Define public routes
const publicPaths = ['/login', '/signup', '/auth/confirm', '/error']; // Add other public paths like '/', '/products', etc.

function isPublic(pathname: string): boolean {
  return publicPaths.some(path => pathname === path || (path !== '/' && pathname.startsWith(path)));
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

  // IMPORTANT: Avoid manually calling getSession() here.
  // The createServerClient setup above handles session refreshing automatically
  // when you make subsequent auth calls like getUser().

  // Get user information (this will also handle session refresh)
  const { data: { user } } = await supabase.auth.getUser()

  // Get URL path
  const { pathname } = request.nextUrl;

  // Handle public routes
  if (isPublic(pathname)) {
    return response; // Allow access
  }

  // Redirect unauthenticated users trying to access protected routes
  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('message', 'Please log in to access this page.');
    console.log('Redirecting unauthenticated user to login from:', pathname);
    return NextResponse.redirect(url);
  }

  // Implement RBAC for authenticated users
  try {
    // Query the public User table to get the role using the SAME Supabase client instance
    const { data: userData, error: userError } = await supabase
      .from('User') // Use the exact table name
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError) {
      console.error('Error fetching user role in middleware:', userError.message);
      // Redirect to a generic error or home page if role check fails
      const url = request.nextUrl.clone();
      url.pathname = '/error';
      url.searchParams.set('message', 'Error checking user permissions.');
      return NextResponse.redirect(url);
    }

    const userRole = userData?.role;
    console.log(`User: ${user.email}, Role: ${userRole}, Path: ${pathname}`);

    // Redirect logic based on role
    if (pathname.startsWith('/admin') && userRole !== 'ADMIN') {
      console.log('Redirecting non-admin from /admin');
      return NextResponse.redirect(new URL('/', request.url));
    }

    if (pathname.startsWith('/vendor') && userRole !== 'VENDOR' && userRole !== 'ADMIN') {
      console.log('Redirecting non-vendor/admin from /vendor');
      return NextResponse.redirect(new URL('/', request.url));
    }

    if (pathname.startsWith('/agent') && userRole !== 'AGENT' && userRole !== 'ADMIN') {
      console.log('Redirecting non-agent/admin from /agent');
      return NextResponse.redirect(new URL('/', request.url));
    }

  } catch (e) {
    console.error('Exception during RBAC check in middleware:', e);
    const url = request.nextUrl.clone();
    url.pathname = '/error';
    url.searchParams.set('message', 'An unexpected error occurred while checking permissions.');
    return NextResponse.redirect(url);
  }

  // If all checks pass, allow the request to proceed
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
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    // Include specific API routes if needed, but the general pattern usually covers them
    // '/api/:path*',
  ],
} 