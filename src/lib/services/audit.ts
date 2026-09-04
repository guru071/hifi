import { createServerClient } from '@/lib/supabase/server';
import type { Json } from '@/types/supabase';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Append an entry to the audit log. Used for admin/mutation actions.
 */
export async function logAudit(
  input: {
    actorUserId?: string | null;
    actorRole?: string | null;
    action: string;
    entityType?: string | null;
    entityId?: string | null;
    before?: unknown;
    after?: unknown;
    ip?: string | null;
  },
  supabase?: SupabaseClient
) {
  const client = supabase ?? createServerClient();
  const { error } = await client.from('audit_logs').insert({
    actor_user_id: input.actorUserId ?? null,
    actor_role: input.actorRole ?? null,
    action: input.action,
    entity_type: input.entityType ?? null,
    entity_id: input.entityId ?? null,
    before: (input.before as Json) ?? null,
    after: (input.after as Json) ?? null,
    ip: input.ip ?? null,
  });
  if (error) {
    console.error('Audit log write failed:', error.message);
  }
}