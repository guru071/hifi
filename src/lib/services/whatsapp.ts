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

export async function sendRawWhatsAppPayload(payload: any) {
  const token = process.env.MAGHGO_BOT_TOKEN;
  const maghgoApi = process.env.MAGHGO_OUTBOUND_API_URL;
  if (!maghgoApi || !token) {
    throw new Error('MAGHGO_OUTBOUND_API_URL or MAGHGO_BOT_TOKEN not configured.');
  }

  const res = await fetch(maghgoApi, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Maghgo WhatsApp send failed (${res.status}): ${errBody}`);
  }

  return res.json();
}

export async function sendWhatsAppMessage(to: string, bodyText: string, payloadMeta?: Record<string, string>) {
  return sendRawWhatsAppPayload({
    messaging_product: 'whatsapp',
    to,
    type: 'text',
    text: { body: bodyText, preview_url: false },
    ...(payloadMeta ? { context: payloadMeta } : {}),
  });
}

export interface ReplyButton {
  id: string;   // returned to us as the "command" when tapped
  title: string; // <= 20 chars (WhatsApp limit)
}

/**
 * Up to THREE tappable reply buttons under a message.
 */
export async function sendWhatsAppButtons(to: string, body: string, buttons: ReplyButton[]) {
  return sendRawWhatsAppPayload({
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: 'interactive',
    interactive: {
      type: 'button',
      body: { text: body.slice(0, 1024) },
      action: {
        buttons: buttons.slice(0, 3).map((b) => ({
          type: 'reply',
          reply: { id: b.id, title: b.title.slice(0, 20) },
        })),
      },
    },
  });
}

/**
 * A single "call to action" URL button under a message.
 */
export async function sendWhatsAppCtaUrl(to: string, body: string, buttonText: string, url: string) {
  return sendRawWhatsAppPayload({
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: 'interactive',
    interactive: {
      type: 'cta_url',
      body: { text: body.slice(0, 1024) },
      action: { name: 'cta_url', parameters: { display_text: buttonText.slice(0, 20), url } },
    },
  });
}

/** A plain image with a caption. */
export async function sendWhatsAppImage(to: string, imageUrl: string, caption?: string) {
  return sendRawWhatsAppPayload({
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: 'image',
    image: { link: imageUrl, ...(caption ? { caption: caption.slice(0, 1024) } : {}) },
  });
}

export interface ListRow {
  id: string;
  title: string;        // <= 24 chars
  description?: string; // <= 72 chars
}

/**
 * A "menu" button that opens a scrollable list.
 */
export async function sendWhatsAppList(to: string, body: string, buttonLabel: string, rows: ListRow[], header?: string) {
  return sendRawWhatsAppPayload({
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: 'interactive',
    interactive: {
      type: 'list',
      ...(header ? { header: { type: 'text', text: header.slice(0, 60) } } : {}),
      body: { text: body.slice(0, 1024) },
      action: {
        button: buttonLabel.slice(0, 20),
        sections: [{ title: 'Options', rows: rows.slice(0, 10).map(r => ({
          id: r.id, 
          title: r.title.slice(0, 24),
          ...(r.description ? { description: r.description.slice(0, 72) } : {})
        }))}],
      },
    },
  });
}

/**
 * A native "Catalog" message that displays products in a horizontal scroll (Multi-Product Message).
 * Requires products to exist in a linked Facebook Commerce Catalog.
 */
export async function sendWhatsAppProductList(
  to: string,
  catalogId: string,
  productRetailerIds: string[],
  body: string,
  header?: string,
  footer?: string
) {
  if (!catalogId) throw new Error('WhatsApp Catalog ID is required for Product List messages');
  if (productRetailerIds.length === 0) throw new Error('At least one product_retailer_id is required');

  return sendRawWhatsAppPayload({
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: 'interactive',
    interactive: {
      type: 'product_list',
      ...(header ? { header: { type: 'text', text: header.slice(0, 60) } } : {}),
      body: { text: body.slice(0, 1024) },
      ...(footer ? { footer: { text: footer.slice(0, 60) } } : {}),
      action: {
        catalog_id: catalogId,
        sections: [
          {
            title: 'Featured Products',
            product_items: productRetailerIds.slice(0, 30).map(id => ({
              product_retailer_id: id
            }))
          }
        ]
      }
    }
  });
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