import { createServerClient } from '@/lib/supabase/server';
import type { User } from '@supabase/supabase-js';

/**
 * Returns the HIFI profile role for an authenticated auth user, or null.
 * Looks up public.users by the auth user's id (mapped from auth.users on signup).
 */
export async function getUserRole(authUserId: string): Promise<'admin' | 'customer' | null> {
  const supabase = createServerClient();
  const { data } = await supabase
    .from('users')
    .select('role')
    .eq('auth_id', authUserId)
    .maybeSingle();
  return (data?.role as 'admin' | 'customer' | undefined) ?? null;
}

/**
 * Server component / action guard: resolves the current user and their role.
 * Returns { user, role } or throws/redirects for unauthorized access.
 */
export async function requireAdmin(user: User | null) {
  if (!user) return null;
  const role = await getUserRole(user.id);
  if (role !== 'admin') return null;
  return { user, role };
}
