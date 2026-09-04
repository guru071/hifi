import { createServerClient } from '@/lib/supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Resolve the public.users profile id (and row) for an authenticated auth user.
 * Looks up the link on users.auth_id.
 */
export async function getProfileByAuthId(authId: string, supabase?: SupabaseClient) {
  const client = supabase ?? createServerClient();
  const { data } = await client
    .from('users')
    .select('id, email, full_name, phone, role, auth_id')
    .eq('auth_id', authId)
    .maybeSingle();
  return data ?? null;
}

export async function getProfileByEmail(email: string | undefined, supabase?: SupabaseClient) {
  if (!email) return null;
  const client = supabase ?? createServerClient();
  const { data } = await client
    .from('users')
    .select('id, email, full_name, phone, role, auth_id')
    .eq('email', email)
    .maybeSingle();
  return data ?? null;
}

/**
 * Set the phone number on a user's profile (used to satisfy the
 * "phone required on all signups" rule, including after OAuth).
 */
export async function setUserPhone(
  profileId: string,
  phone: string,
  supabase?: SupabaseClient
) {
  const client = supabase ?? createServerClient();
  const { error } = await client.from('users').update({ phone }).eq('id', profileId);
  if (error) throw new Error(`Failed to set phone: ${error.message}`);
  return true;
}