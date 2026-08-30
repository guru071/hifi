import { NextResponse } from 'next/server';

/**
 * Firebase logout is handled entirely client-side via firebaseAuth.signOut().
 * This endpoint exists only for compatibility and redirects to /login.
 */
export async function GET() {
  return NextResponse.redirect(new URL('/login', process.env.NEXT_PUBLIC_SITE_URL!));
}
