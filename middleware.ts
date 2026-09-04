import { NextResponse, type NextRequest } from 'next/server';

/**
 * Next.js Middleware — runs at the Edge before any route handler.
 *
 * Strategy:
 * - Admin routes (/admin/*): protected by the `admin_token` cookie set by /api/admin/login.
 * - Customer auth (/login, /register, /profile, etc.) is handled client-side by Firebase.
 *   We do NOT redirect those here because the Firebase session is only available in the browser.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect admin routes (except /admin/login itself)
  const isAdmin = pathname === '/admin' || pathname.startsWith('/admin/');
  if (isAdmin && pathname !== '/admin/login') {
    const adminToken = request.cookies.get('admin_token')?.value;
    if (!adminToken || adminToken !== 'authenticated') {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = '/admin/login';
      loginUrl.search = '';
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
