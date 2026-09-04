import crypto from 'crypto';
import { createServerClient } from '@/lib/supabase/server';
import { getRazorpay } from '@/lib/services/orders';
import type { Json } from '@/types/supabase';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Verify a Razorpay payment signature (used by the client-side verify route).
 * payload = order_id + '|' + payment_id ; signature = signature from Razorpay.
 */
export function verifyPaymentSignature(orderId: string, paymentId: string, signature: string): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET!;
  const body = `${orderId}|${paymentId}`;
  const expected = crypto.createHmac('sha256', secret).update(body).digest('hex');
  const provided = signature;
  const a = Buffer.from(expected);
  const b = Buffer.from(provided);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

/**
 * Validate + parse a Razorpay webhook event (signature verification against the
 * raw body so the hash is computed exactly as Razorpay did).
 */
export function verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
  if (!signature) return false;
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET!;
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

/**
 * Idempotent webhook handler. Stores an audit-trail payment row keyed by the
 * Razorpay payment id, then updates the order status. Safe to call repeatedly.
 */
export async function processPaymentEvent(
  eventId: string,
  payload: { entity: { id: string; order_id: string; amount: number; status: string } },
  supabase?: SupabaseClient
) {
  const client = supabase ?? createServerClient();
  const entity = payload.entity;

  const existing = await client
    .from('payments')
    .select('id')
    .eq('razorpay_payment_id', entity.id)
    .maybeSingle();

  const paymentRecord = {
    razorpay_order_id: entity.order_id,
    razorpay_payment_id: entity.id,
    amount: entity.amount / 100,
    currency: 'INR',
    status: (entity.status as 'pending' | 'authorized' | 'captured' | 'failed' | 'refunded') || 'pending',
    event_id: eventId,
    paid_at: new Date().toISOString(),
  };

  if (existing?.data) {
    await client.from('payments').update(paymentRecord).eq('id', existing.data.id);
  } else {
    await client.from('payments').insert(paymentRecord);
  }

  // Find the order by razorpay order id
  const { data: order } = await client
    .from('orders')
    .select('*')
    .eq('razorpay_order_id', entity.order_id)
    .maybeSingle();

  if (!order) return { success: false, reason: 'order_not_found' };

  const authorized = entity.status === 'authorized' || entity.status === 'captured';

  if (authorized) {
    await client
      .from('orders')
      .update({
        payment_status: 'paid',
        status: 'paid',
        razorpay_payment_id: entity.id,
      })
      .eq('id', order.id);
    await generateInvoice(order.id);
  } else if (entity.status === 'failed') {
    await client
      .from('orders')
      .update({ payment_status: 'failed' })
      .eq('id', order.id);
  }

  return { success: true };
}

/**
 * Generate (or regenerate) an invoice from the order's stored price snapshot.
 */
export async function generateInvoice(orderId: string, supabase?: SupabaseClient) {
  const client = supabase ?? createServerClient();
  const { data: order } = await client.from('orders').select('*').eq('id', orderId).maybeSingle();
  if (!order) return null;

  const invoiceNumber = `HIFI-${orderId.slice(0, 8).toUpperCase()}`;
  const existing = await client.from('invoices').select('id').eq('order_id', orderId).maybeSingle();

  const invoice = {
    invoice_number: invoiceNumber,
    order_id: orderId,
    user_id: order.user_id,
    subtotal: order.subtotal_amount ?? order.total_amount,
    delivery_fee: order.delivery_fee ?? order.shipping_fee ?? 0,
    total: order.total_amount,
    currency: order.currency || 'INR',
    status: 'paid' as 'paid' | 'refunded' | 'void',
    gst_percent: 0,
    gst_amount: 0,
    items_snapshot: (order.items_snapshot as Json) ?? null,
    billing_address: (order.shipping_address as Json) ?? null,
  };

  if (existing?.data) {
    await client.from('invoices').update(invoice).eq('id', existing.data.id);
    return existing.data.id;
  }
  const { data, error } = await client.from('invoices').insert(invoice).select().single();
  if (error) {
    console.error('Failed to generate invoice:', error.message);
    return null;
  }
  return data?.id ?? null;
}

export { getRazorpay };