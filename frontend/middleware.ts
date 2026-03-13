import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtDecode } from 'jwt-decode';

function getRbacRedirect(pathname: string, token: string, url: string): NextResponse | null {
  try {
    const decoded = jwtDecode<{ role: string }>(token);
    if (pathname.startsWith('/admin') && decoded.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/', url));
    }
    if (pathname.startsWith('/orders') && decoded.role === 'ADMIN') {
      return NextResponse.redirect(new URL('/admin/orders', url));
    }
    return null;
  } catch {
    return NextResponse.redirect(new URL('/login', url));
  }
}

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  const { pathname } = request.nextUrl;

  const protectedRoutes = ['/profile', '/orders', '/admin'];

  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

  // 1. If trying to access a protected route without a token -> Redirect to login
  if (isProtectedRoute && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 2. If trying to access login/register with a token, we let the page load.
  // The AuthProvider will handle redirected if the session is actually valid.
  // This prevents redirect loops in E2E tests where server-side session check might fail
  // while middleware (using jwt-decode) thinks it's valid.

  // 3. RBAC: Role-based access control
  if ((pathname.startsWith('/admin') || pathname.startsWith('/orders')) && token) {
    const redirect = getRbacRedirect(pathname, token, request.url);
    if (redirect) return redirect;
  }

  // 4. Redirect ADMIN from root to admin dashboard
  if (pathname === '/' && token) {
    try {
      const decoded = jwtDecode<{ role: string }>(token);
      if (decoded.role === 'ADMIN') {
        return NextResponse.redirect(new URL('/admin', request.url));
      }
    } catch {
      // Ignore invalid tokens here, let the normal flow handle it
    }
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
