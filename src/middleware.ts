import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only protect /admin routes, but allow access to /admin/login
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    const adminToken = request.cookies.get('admin_token')?.value;
    
    // In a real app we'd verify a signed JWT, but since we are doing simple 
    // password auth identical to maghgo, checking for the presence of the 
    // token is our basic guard. The actual password verification happens in 
    // the /api/admin/login route before this cookie is ever set.
    if (!adminToken || adminToken !== 'authenticated') {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
