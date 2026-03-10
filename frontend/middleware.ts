import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/request';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  const { pathname } = request.nextUrl;

  // Define public routes that should NOT be accessible if authenticated (e.g., login/register)
  const authRoutes = ['/login', '/register'];
  
  // Define protected routes that REQUIRE authentication
  // For now, let's assume /profile and / are protected if we want to force login for the home page,
  // or we can just protect /profile.
  const protectedRoutes = ['/profile'];

  const isAuthRoute = authRoutes.includes(pathname);
  const isProtectedRoute = protectedRoutes.includes(pathname);

  // 1. If trying to access a protected route without a token -> Redirect to login
  if (isProtectedRoute && !token) {
    const response = NextResponse.redirect(new URL('/login', request.url));
    // Optional: add a callback URL to redirect back after login
    // response.searchParams.set('callbackUrl', pathname);
    return response;
  }

  // 2. If trying to access login/register with a valid token -> Redirect to home
  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
