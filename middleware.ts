import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "./auth";

export async function middleware(request: NextRequest) {
  const session = await auth();
  const user = session?.user;

  // Public routes accessible to everyone
  const publicRoutes = [
    "/",
    "/auth/login",
    "/auth/register",
    "/auth/forgot-password",
    "/products",
    "/categories",
  ];

  // Check if the current path is in the public routes
  const isPublicRoute = publicRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  );

  // If it's a public route, allow access
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // If user is not authenticated, redirect to login page
  if (!user) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  // Admin routes
  if (
    request.nextUrl.pathname.startsWith("/admin") &&
    user.role !== "ADMIN"
  ) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Vendor routes
  if (
    request.nextUrl.pathname.startsWith("/vendor") &&
    user.role !== "VENDOR" &&
    user.role !== "ADMIN"
  ) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Customer routes
  if (
    request.nextUrl.pathname.startsWith("/customer") &&
    user.role !== "CUSTOMER" &&
    user.role !== "ADMIN"
  ) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/vendor/:path*",
    "/customer/:path*",
    "/api/admin/:path*",
    "/api/vendor/:path*",
    "/api/customer/:path*",
  ],
}; 