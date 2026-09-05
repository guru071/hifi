import { createClient } from '@supabase/supabase-js';
import { createServerClient as createSsrServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;

/**
 * Service-role client for admin/backend operations.
 * Backward compatible with existing API routes.
 * NEVER expose this key to the browser.
 */
export const createServerClient = () => {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !key) {
    throw new Error('Supabase server configuration is missing. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
  }
  return createClient<Database>(supabaseUrl, key);
};

/**
 * Cookie-based client for Server Components and Route Handlers.
 * Uses the user's session cookies so Row Level Security applies.
 */
export async function createRouteClient() {
  const cookieStore = await cookies();

  return createSsrServerClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from a Server Component; safe to ignore when Proxy refreshes sessions.
        }
      },
    },
  });
}
