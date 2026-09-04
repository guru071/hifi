---
name: real_integrations
description: Mandatory checklist for implementing real, production-ready third-party APIs (WhatsApp, Razorpay, Meta Graph API) without mocks.
---

# Real Third-Party Integration Skill

## 1. Environment Variable Setup
- NEVER guess or assume env vars exist.
- Identify ALL required keys (e.g., `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`).
- Add them to `.env.local` IMMEDIATELY before writing any integration code.
- Document each key in `.env.example` with placeholder values.

## 2. No Mocking Allowed
- Use actual HTTP `fetch()` or official SDK calls to the provider.
- Never return `{ success: true }` without actually calling the provider's API.
- For media downloads (WhatsApp images), stream directly from the provider's endpoint using bearer tokens:
  ```typescript
  const mediaResponse = await fetch(mediaUrl, {
    headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}` }
  });
  const buffer = Buffer.from(await mediaResponse.arrayBuffer());
  ```

## 3. Bidirectional Webhooks
- **Inbound:** Validate signature/source (e.g., Razorpay HMAC, Meta webhook verify token).
- **Outbound:** If webhook implies an automated reply (bot responder), implement outbound POST back to provider.
- Example WhatsApp outbound:
  ```typescript
  await fetch(`https://graph.facebook.com/v17.0/${PHONE_ID}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ messaging_product: 'whatsapp', to: fromNumber, type: 'text', text: { body: message } })
  });
  ```

## 4. Payment Verification (Razorpay)
- Create Razorpay order server-side FIRST.
- After client payment, verify server-side using HMAC SHA256:
  ```typescript
  const expectedSignature = crypto.createHmac('sha256', secret)
    .update(razorpay_order_id + '|' + razorpay_payment_id).digest('hex');
  ```
- Never trust client-side payment status.

## 5. Error Handling
- Handle timeouts, invalid payloads, auth failures gracefully.
- Never let third-party failures crash the main application flow.
- Log errors with contextual IDs (order_id, payment_id, message_id).
