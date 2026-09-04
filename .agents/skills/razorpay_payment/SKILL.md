---
name: razorpay_payment
description: Complete Razorpay payment integration lifecycle - order creation, client checkout, server verification, webhook processing.
---

# Razorpay Payment Skill

## 1. Required Environment Variables
```
RAZORPAY_KEY_ID=<your_key_id>
RAZORPAY_KEY_SECRET=<your_key_secret>
NEXT_PUBLIC_RAZORPAY_KEY_ID=<same key for frontend>
```

## 2. Payment Lifecycle
```
Server creates Razorpay order → Client opens checkout → Client pays →
Server verifies signature → Webhook confirms → Order marked paid
```

## 3. Server-Side Order Creation
```typescript
import Razorpay from 'razorpay';
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!
});
const rpOrder = await razorpay.orders.create({
  amount: serverCalculatedTotal * 100, // paise
  currency: 'INR',
  receipt: `order_${orderId}`
});
```

## 4. Server-Side Verification
```typescript
import crypto from 'crypto';
const expectedSignature = crypto
  .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
  .update(`${razorpay_order_id}|${razorpay_payment_id}`)
  .digest('hex');
if (expectedSignature !== razorpay_signature) {
  return NextResponse.json({ error: "Payment verification failed" }, { status: 400 });
}
```

## 5. Critical Rules
- NEVER trust `"frontend says success → mark paid"`.
- Amount in Razorpay order must match server-calculated total.
- Protect against: duplicate callbacks, duplicate webhooks, replayed events, tampered amounts.
- Process webhooks idempotently (check if already processed before updating).

## 6. Webhook Processing
- Verify Razorpay webhook signature using `X-Razorpay-Signature` header.
- Update order status to `paid` only after verification.
- Log payment_id, order_id for audit trail.
