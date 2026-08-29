import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { createRouteClient } from '@/lib/supabase/server';
import { getUserRole } from '@/lib/admin';

/**
 * Admin guard for route handlers.
 * Resolves the caller from the Authorization Bearer token or the session cookie,
 * then verifies the profile is an admin. Returns the admin profile or a NextResponse
 * to short-circuit with 401/403.
 */
export async function requireAdminRequest(request: Request) {
  const serviceClient = createServerClient();

  let user: Awaited<ReturnType<typeof serviceClient.auth.getUser>>['data']['user'] | null = null;
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    const { data } = await serviceClient.auth.getUser(token);
    user = data.user;
  } else {
    const routeClient = await createRouteClient();
    const { data } = await routeClient.auth.getUser();
    user = data.user;
  }

  if (!user) {
    return { admin: null, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  const role = await getUserRole(user.id);
  if (role !== 'admin') {
    return { admin: null, response: NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 }) };
  }

  return { admin: { user, role }, response: null };
}

/**
 * Returns the authenticated caller's profile role ('admin' | 'customer' | null) from a request.
 */
export async function getRequestRole(request: Request): Promise<'admin' | 'customer' | null> {
  const serviceClient = createServerClient();
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    const { data } = await serviceClient.auth.getUser(token);
    if (!data.user) return null;
    return getUserRole(data.user.id);
  }
  const routeClient = await createRouteClient();
  const { data } = await routeClient.auth.getUser();
  if (!data.user) return null;
  return getUserRole(data.user.id);
}