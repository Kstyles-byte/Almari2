// This file ensures that route configuration is properly loaded
// and the checkout route is treated as a dynamic route

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

// This route handler just redirects to the actual checkout page
export async function GET() {
  // Redirect to main checkout page
  return Response.redirect(new URL('/checkout', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'));
} 