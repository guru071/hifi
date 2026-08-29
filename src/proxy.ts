import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const AUTH_PROTECTED = ['/profile', '/checkout', '/complete-signup'];
const AUTH_ONLY_PUBLIC = ['/login', '/register'];

function isProtected(pathname: string) {
  return AUTH_PROTECTED.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}
function isPublicOnly(pathname: string) {
  return AUTH_ONLY_PUBLIC.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}
function isAdmin(pathname: string) {
  return pathname === '/admin' || pathname.startsWith('/admin/');
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  let response = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const needsAuth = isProtected(pathname);
  const isPublicPage = isPublicOnly(pathname);

  if (needsAuth && !user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/login';
    redirectUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (isPublicPage && user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/profile';
    redirectUrl.search = '';
    return NextResponse.redirect(redirectUrl);
  }

  // Handle Admin Password Protection
  if (isAdmin(pathname) && pathname !== '/admin/login') {
    const adminToken = request.cookies.get('admin_token')?.value;
    if (!adminToken || adminToken !== 'authenticated') {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/admin/login';
      return NextResponse.redirect(redirectUrl);
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/profile/:path*',
    '/checkout/:path*',
    '/complete-signup',
    '/admin/:path*',
    '/login',
    '/register',
  ],
};
