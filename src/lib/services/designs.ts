import { createServerClient } from '@/lib/supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js';

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/**
 * Generate a human-friendly reference code like HIFI-8X4M.
 */
export function generateReferenceCode(): string {
  let rnd = '';
  const bytes = crypto.getRandomValues(new Uint8Array(4));
  bytes.forEach((b) => (rnd += CODE_CHARS[b % CODE_CHARS.length]));
  return `HIFI-${rnd}`;
}

/**
 * Create a design submission record and return it with its reference code.
 * Links to the submitting profile if one is known.
 */
export async function createDesignSubmission({
  profileId,
  senderPhone,
  designName,
  mediaUrl,
  notes,
  supabase,
}: {
  profileId?: string | null;
  senderPhone?: string | null;
  designName?: string | null;
  mediaUrl?: string | null;
  notes?: string | null;
  supabase?: SupabaseClient;
}) {
  const client = supabase ?? createServerClient();

  const referenceCode = generateReferenceCode();
  const { data, error } = await client
    .from('custom_designs')
    .insert({
      user_id: profileId ?? null,
      reference_code: referenceCode,
      status: 'pending',
      sender_phone: senderPhone ?? null,
      design_name: designName ?? null,
      media_url: mediaUrl ?? null,
      design_image_url: mediaUrl ?? null,
      notes: notes ?? null,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create design submission: ${error.message}`);
  return data;
}

/**
 * Resolve a design's stored image reference into a viewable URL.
 *
 * - WhatsApp/uploads store a bare object path inside the PRIVATE `designs` bucket,
 *   which must be served via a short-lived signed URL (admin only).
 * - Absent paths resolve to null so the UI can render its empty state.
 */
export async function resolveDesignImageUrl(
  stored: string | null,
  supabase: SupabaseClient
): Promise<string | null> {
  if (!stored) return null;
  if (stored.startsWith('http://') || stored.startsWith('https://')) return stored;

  try {
    const { data, error } = await supabase.storage
      .from('designs')
      .createSignedUrl(stored, 3600);
    if (error || !data?.signedUrl) return null;
    return data.signedUrl;
  } catch {
    return null;
  }
}