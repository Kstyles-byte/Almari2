import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// Define paths that REQUIRE authentication
const protectedPaths = ['/admin', '/vendor', '/agent', '/account', '/customer']; // /cart removed to allow guest

// Define paths that should be exempted from authentication even though they start with a protected path
const exemptPaths = ['/checkout/complete', '/checkout/thank-you'];

// Function to check if a path is protected
function isProtectedRoute(pathname: string): boolean {
  if (exemptPaths.some(path => pathname.startsWith(path))) {
    return false;
  }
  return protectedPaths.some(path =>
    pathname === path || pathname.startsWith(`${path}/`)
  );
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options });
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  const { pathname } = request.nextUrl;
  const isProtected = isProtectedRoute(pathname);

  // 1. If the route is protected and the user is NOT logged in, redirect to login
  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('message', 'Please log in to access this page.');
    return NextResponse.redirect(url);
  }

  // 2. If the route is protected and the user IS logged in, perform RBAC checks
  //    THIS IS COMMENTED OUT BECAUSE IT'S NOT SUPPORTED IN VERCEL'S EDGE RUNTIME
  /*
  if (isProtected && user) {
    try {
      const { data: userData, error: userError } = await supabase
        .from('User')
        .select('role')
        .eq('id', user.id)
        .single();

      if (userError) {
        console.error('[Middleware] Error fetching user role:', userError.message);
      } else {
        const userRole = userData?.role;
        if (pathname.startsWith('/admin') && userRole !== 'ADMIN') {
          return NextResponse.redirect(new URL('/', request.url));
        }
        if (pathname.startsWith('/vendor') && userRole !== 'VENDOR' && userRole !== 'ADMIN') {
          return NextResponse.redirect(new URL('/', request.url));
        }
        if (pathname.startsWith('/agent') && userRole !== 'AGENT' && userRole !== 'ADMIN') {
          return NextResponse.redirect(new URL('/', request.url));
        }
      }
    } catch (e) {
      console.error('[Middleware] Exception during RBAC check:', e);
      const url = request.nextUrl.clone();
      url.pathname = '/error';
      url.searchParams.set('message', 'An unexpected error occurred while checking permissions.');
      return NextResponse.redirect(url);
    }
  }
  */

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
