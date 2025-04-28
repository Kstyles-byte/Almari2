import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
// Import the server client to query the public User table
import { createClient } from '@/lib/supabase/server' 

// Define public routes
const publicRoutes = [
  '/', // Homepage
  '/login', // Login page
  '/signup', // Signup page
  '/forgot-password',
  '/reset-password', // Technically needs a token, but page itself can load
  '/products', // Main product listing page
  '/product/*', // All individual product pages
  // Add category pages if they exist and should be public
  // '/categories',
  // '/category/*',
  '/cart', // Cart page
  '/checkout', // Checkout page (login might be enforced later in the flow)
  // Add other static pages like /about, /contact, /faq if they exist
  // Add other specific public paths if needed, e.g.:
  // '/products',
  // '/api/public/*' 
];

// Function to check if a path is public
function isPublic(path: string): boolean {
  return publicRoutes.some(route => {
    if (route.endsWith('/*')) {
      // Handle wildcard routes (simple prefix match)
      return path.startsWith(route.slice(0, -2));
    } 
    return path === route;
  });
}

export async function middleware(request: NextRequest) {
  // 1. Refresh the session and get the response object
  const response = await updateSession(request)

  // 2. Get user from refreshed session
  // We need to create a client instance here AFTER updateSession ran,
  // to ensure cookies are handled correctly for this call.
  const supabase = createClient() 
  const { data: { user } } = await supabase.auth.getUser()

  // 3. Get URL path
  const { pathname } = request.nextUrl;

  // 4. Handle public routes
  if (isPublic(pathname)) {
    return response; // Allow access to public routes
  }

  // 5. Redirect unauthenticated users trying to access protected routes
  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('message', 'Please log in to access this page.');
    console.log('Redirecting unauthenticated user to login from:', pathname);
    return NextResponse.redirect(url);
  }

  // 6. Implement RBAC for authenticated users
  let userRole: string | null = null;
  try {
    // Query the public User table to get the role
    const { data: userData, error: userError } = await supabase
      .from('User') // Use the exact table name from your schema
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError) {
      console.error('Error fetching user role:', userError.message);
      // Decide how to handle: block access, redirect to error, or allow temporarily?
      // For safety, let's redirect to home with an error
      const url = request.nextUrl.clone();
      url.pathname = '/';
      url.searchParams.set('message', 'Error checking user role.');
      return NextResponse.redirect(url);
    }
    userRole = userData?.role;
    
  } catch (e) {
    console.error('Exception fetching user role:', e);
    const url = request.nextUrl.clone();
    url.pathname = '/';
    url.searchParams.set('message', 'Error checking user role.');
    return NextResponse.redirect(url);
  }
  
  // Redirect logic based on role
  console.log(`User: ${user.email}, Role: ${userRole}, Path: ${pathname}`);

  if (pathname.startsWith('/admin') && userRole !== 'ADMIN') {
    console.log('Redirecting non-admin from /admin');
    const url = request.nextUrl.clone();
    url.pathname = '/'; 
    return NextResponse.redirect(url);
  }
  
  if (pathname.startsWith('/vendor') && userRole !== 'VENDOR' && userRole !== 'ADMIN') {
    console.log('Redirecting non-vendor/admin from /vendor');
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }
  
  // Example: Agent routes (assuming agents have a dashboard)
  if (pathname.startsWith('/agent') && userRole !== 'AGENT' && userRole !== 'ADMIN') {
     console.log('Redirecting non-agent/admin from /agent');
     const url = request.nextUrl.clone();
     url.pathname = '/';
     return NextResponse.redirect(url);
  }

  // If all checks pass, continue to the requested page with the updated session
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