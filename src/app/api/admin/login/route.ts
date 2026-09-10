import { NextResponse } from 'next/server';
import { createAdminSession } from '@/lib/admin-session';

export async function POST(request: Request) {
  try {
    const { password } = await request.json();
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword || password !== adminPassword) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }

    const token = await createAdminSession('admin@local');
    const response = NextResponse.json({ success: true, token }, { status: 200 });
    
    // Cookie expires in 8 hours (matches JWT expiration)
    const expires = new Date(Date.now() + 8 * 60 * 60 * 1000);
    
    response.cookies.set({
      name: 'hifi_admin_session',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: expires,
      path: '/',
    });

    return response;
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
