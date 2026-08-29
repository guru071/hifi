import { createRouteClient } from '@/lib/supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js';

export type AuthSession = {
  user: Awaited<ReturnType<typeof getUserFromRoute>>;
};

/**
 * Server-only: returns the authenticated supabase auth user.
 * Safe for Server Components / Server Actions / Route Handlers.
 */
export async function getUserFromRoute() {
  const supabase = await createRouteClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/**
 * API helper: resolve the auth user from an incoming Request either via
 * the session cookie (createRouteClient) or via an Authorization Bearer token
 * (used with the service-role client). Returns the user or null.
 */
export async function getApiAuthUser(
  request: Request,
  client: SupabaseClient
): Promise<Awaited<ReturnType<SupabaseClient['auth']['getUser']>>['data']['user'] | null> {
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    const {
      data: { user },
    } = await client.auth.getUser(token);
    return user;
  }
  const routeClient = await createRouteClient();
  const {
    data: { user },
  } = await routeClient.auth.getUser();
  return user;
}
