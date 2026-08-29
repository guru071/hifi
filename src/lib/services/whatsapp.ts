import crypto from 'crypto';
import { createServerClient } from '@/lib/supabase/server';
import type { Json } from '@/types/supabase';

const GRAPH_BASE = 'https://graph.facebook.com/v19.0';

/**
 * Verify the X-Hub-Signature-256 header of an incoming Meta webhook against the
 * raw request body using HMAC-SHA256 (timing-safe compare).
 */
export function verifyWhatsAppSignature(rawBody: string, signatureHeader: string | null): boolean {
  if (!signatureHeader) return false;
  const secret = process.env.WHATSAPP_VERIFY_TOKEN!;
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  const provided = signatureHeader.replace(/^sha256=/, '');
  const a = Buffer.from(expected);
  const b = Buffer.from(provided);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

/**
 * Send an outbound WhatsApp message via the Business Cloud API.
 */
export async function sendWhatsAppMessage(to: string, bodyText: string, payloadMeta?: Record<string, string>) {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneNumberId) {
    throw new Error('WHATSAPP_TOKEN / WHATSAPP_PHONE_NUMBER_ID not configured');
  }

  const res = await fetch(`${GRAPH_BASE}/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body: bodyText, preview_url: false },
      ...(payloadMeta ? { context: payloadMeta } : {}),
    }),
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`WhatsApp send failed (${res.status}): ${errBody}`);
  }

  return res.json();
}

/**
 * Download WhatsApp media: two-step flow — GET /{media-id} returns a signed url,
 * then GET the url with the same Bearer token. Returns the buffer + mime type.
 */
export async function downloadWhatsAppMedia(mediaId: string) {
  const token = process.env.WHATSAPP_TOKEN;
  if (!token) throw new Error('WHATSAPP_TOKEN not configured');

  const metaRes = await fetch(`${GRAPH_BASE}/${mediaId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!metaRes.ok) throw new Error('Failed to resolve media');
  const meta = await metaRes.json();
  if (!meta.url) throw new Error('Media has no download URL');

  const binRes = await fetch(meta.url, { headers: { Authorization: `Bearer ${token}` } });
  if (!binRes.ok) throw new Error('Failed to download media binary');
  const buffer = Buffer.from(await binRes.arrayBuffer());
  return { buffer, mimeType: meta.mime_type || 'image/jpeg' };
}

/**
 * Record a message into whatsapp_logs (idempotent on wa_message_id).
 */
export async function logWhatsAppMessage(input: {
  direction: 'inbound' | 'outbound';
  waMessageId?: string | null;
  fromNumber?: string | null;
  toNumber?: string | null;
  messageType?: string | null;
  body?: string | null;
  mediaId?: string | null;
  mediaUrl?: string | null;
  status?: string | null;
  customDesignId?: string | null;
  payload?: unknown;
}) {
  const supabase = createServerClient();
  const waMessageId = input.waMessageId ?? null;
  const existing = waMessageId
    ? await supabase.from('whatsapp_logs').select('id').eq('wa_message_id', waMessageId).maybeSingle()
    : null;

  const record = {
    direction: input.direction,
    wa_message_id: input.waMessageId ?? null,
    from_number: input.fromNumber ?? null,
    to_number: input.toNumber ?? null,
    message_type: input.messageType ?? null,
    body: input.body ?? null,
    media_id: input.mediaId ?? null,
    media_url: input.mediaUrl ?? null,
    status: input.status ?? (input.direction === 'inbound' ? 'received' : 'sent'),
    custom_design_id: input.customDesignId ?? null,
    payload: (input.payload as Json) ?? null,
  };

  if (existing?.data) return { id: existing.data.id, existed: true };
  const { data, error } = await supabase.from('whatsapp_logs').insert(record).select().single();
  if (error) throw new Error(`Failed to log whatsapp message: ${error.message}`);
  return { id: data.id, existed: false };
}