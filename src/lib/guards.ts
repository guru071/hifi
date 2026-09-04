import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getUserRole, checkAdminAuth } from '@/lib/admin';
import { verifyFirebaseToken } from '@/lib/firebase/admin';

/**
 * Admin guard for route handlers.
 * Priority:
 *   1. Admin cookie (admin_token=authenticated) — simple admin login
 *   2. Firebase ID token in Authorization header — Firebase-authed admin user
 */
export async function requireAdminRequest(request: Request) {
  // 1. Cookie-based admin (simple admin dashboard login)
  if (await checkAdminAuth()) {
    return { admin: { user: { id: 'simple-admin', email: 'admin@local' }, role: 'admin' as const }, response: null };
  }

  // 2. Firebase token
  const decoded = await verifyFirebaseToken(request);
  if (!decoded) {
    return { admin: null, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  const role = await getUserRole(decoded.uid);
  if (role !== 'admin') {
    return { admin: null, response: NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 }) };
  }

  return { admin: { user: { id: decoded.uid, email: decoded.email }, role }, response: null };
}

/**
 * Returns the authenticated caller's profile role ('admin' | 'customer' | null) from a request.
 */
export async function getRequestRole(request: Request): Promise<'admin' | 'customer' | null> {
  if (await checkAdminAuth()) return 'admin';

  const decoded = await verifyFirebaseToken(request);
  if (!decoded) return null;
  return getUserRole(decoded.uid);
}

/**
 * Resolves the Supabase user profile ID from a Firebase token.
 * Returns null if not authenticated.
 */
export async function getFirebaseProfileId(request: Request): Promise<string | null> {
  const decoded = await verifyFirebaseToken(request);
  if (!decoded) return null;

  const supabase = createServerClient();
  const { data: profile } = await supabase
    .from('users')
    .select('id')
    .eq('auth_id', decoded.uid)
    .maybeSingle();

  return profile?.id ?? null;
}
