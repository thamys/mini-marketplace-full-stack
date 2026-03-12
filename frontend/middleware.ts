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

  const authRoutes = ['/login', '/register'];
  const protectedRoutes = ['/profile', '/orders', '/admin'];

  const isAuthRoute = authRoutes.includes(pathname);
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

  // 1. If trying to access a protected route without a token -> Redirect to login
  if (isProtectedRoute && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 2. If trying to access login/register with a valid token -> Redirect to home
  if (isAuthRoute && token) {
    try {
      jwtDecode(token);
      return NextResponse.redirect(new URL('/', request.url));
    } catch {
      const response = NextResponse.next();
      response.cookies.delete('auth_token');
      return response;
    }
  }

  // 3. RBAC: Role-based access control
  if ((pathname.startsWith('/admin') || pathname.startsWith('/orders')) && token) {
    const redirect = getRbacRedirect(pathname, token, request.url);
    if (redirect) return redirect;
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
