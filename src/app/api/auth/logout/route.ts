import { NextResponse } from 'next/server';

/**
 * Firebase logout is handled entirely client-side via firebaseAuth.signOut().
 * This endpoint exists only for compatibility and redirects to /login.
 */
export async function GET(request: Request) {
  const url = new URL('/login', request.url);
  const response = NextResponse.redirect(url);
  // Clear admin cookie in case admin was logged in
  response.cookies.delete('admin_token');
  return response;
}
