import { describe, it, expect, beforeEach } from 'vitest';
import crypto from 'crypto';
import { generateReferenceCode } from '@/lib/services/designs';
import { verifyPaymentSignature, verifyWebhookSignature } from '@/lib/services/payments';
import { verifyWhatsAppSignature } from '@/lib/services/whatsapp';

describe('designs', () => {
  it('generates a HIFI-XXXX reference code of valid shape', () => {
    const code = generateReferenceCode();
    expect(code).toMatch(/^HIFI-[A-Z0-9]{4}$/);
  });

  it('generates distinct codes across calls', () => {
    const seen = new Set(Array.from({ length: 50 }, () => generateReferenceCode()));
    expect(seen.size).toBe(50);
  });
});

describe('verifyPaymentSignature', () => {
  beforeEach(() => {
    process.env.RAZORPAY_KEY_SECRET = 'test_secret';
  });

  it('accepts a valid signature', () => {
    const orderId = 'order_123';
    const paymentId = 'pay_456';
    const expected = crypto.createHmac('sha256', 'test_secret').update(`${orderId}|${paymentId}`).digest('hex');
    expect(verifyPaymentSignature(orderId, paymentId, expected)).toBe(true);
  });

  it('rejects a tampered signature', () => {
    expect(verifyPaymentSignature('order_123', 'pay_456', 'wrong')).toBe(false);
  });
});

describe('verifyWebhookSignature', () => {
  beforeEach(() => {
    process.env.RAZORPAY_WEBHOOK_SECRET = 'webhook_secret';
  });

  it('accepts a valid signature computed over the raw body', () => {
    const body = JSON.stringify({ event: 'payment.captured' });
    const expected = crypto.createHmac('sha256', 'webhook_secret').update(body).digest('hex');
    expect(verifyWebhookSignature(body, expected)).toBe(true);
  });

  it('rejects missing or invalid signatures', () => {
    expect(verifyWebhookSignature('{}', null)).toBe(false);
    expect(verifyWebhookSignature('{}', 'nope')).toBe(false);
  });
});

describe('verifyWhatsAppSignature', () => {
  beforeEach(() => {
    process.env.WHATSAPP_VERIFY_TOKEN = 'verify_token';
  });

  it('accepts a valid signature with sha256= prefix', () => {
    const body = 'event-body';
    const expected = `sha256=${crypto.createHmac('sha256', 'verify_token').update(body).digest('hex')}`;
    expect(verifyWhatsAppSignature(body, expected)).toBe(true);
  });

  it('rejects invalid or missing signatures', () => {
    expect(verifyWhatsAppSignature('body', null)).toBe(false);
    expect(verifyWhatsAppSignature('body', 'sha256=deadbeef')).toBe(false);
  });
});
