import { NextResponse } from 'next/server';
import { verifyWebhookSignature, processPaymentEvent } from '@/lib/services/payments';

export const maxDuration = 60;

interface RazorpayPaymentEntity {
  id: string;
  order_id: string;
  amount: number;
  status: string;
}

interface RazorpayWebhookPayload {
  event?: string;
  id?: string;
  payload?: {
    payment?: { entity?: RazorpayPaymentEntity; };
    payment_link?: { entity?: any; };
  };
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get('x-razorpay-signature');

  if (!verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 });
  }

  let payload: RazorpayWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as RazorpayWebhookPayload;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const event = payload.event;
  const entity = payload?.payload?.payment?.entity;

  // We only act on payment lifecycle events; ignore the rest quickly
  if (event === 'payment_link.paid') {
    await processPaymentEvent(payload?.id ?? 'payment_link', { entity: payload?.payload?.payment_link?.entity as any }, true);
  } else if (entity && (event === 'payment.captured' || event === 'payment.authorized' || event === 'payment.failed')) {
    await processPaymentEvent(payload?.id ?? `${event}-${entity.id}`, { entity });
  }

  // Always acknowledge promptly to prevent Meta/Razorpay retries
  return NextResponse.json({ received: true }, { status: 200 });
}