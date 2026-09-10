import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyAdminSessionToken } from '@/lib/admin-session';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Proteger todas as rotas administrativas, exceto a página de login
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    const sessionCookie = request.cookies.get('hifi_admin_session')?.value;

    if (!sessionCookie) {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    }

    const session = await verifyAdminSessionToken(sessionCookie);
    if (!session || session.role !== 'admin') {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('error', 'invalid_session');
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
