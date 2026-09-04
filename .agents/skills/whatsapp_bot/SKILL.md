---
name: whatsapp_bot
description: Complete WhatsApp Business API integration for HIFI custom design workflow - inbound media, outbound bot replies, design matching.
---

# WhatsApp Bot Skill

## 1. Required Environment Variables
```
WHATSAPP_TOKEN=<Meta Graph API Bearer Token>
WHATSAPP_PHONE_NUMBER_ID=<Business Phone Number ID>
WHATSAPP_VERIFY_TOKEN=<Custom webhook verification string>
```
Add ALL of these to `.env.local` before writing any code.

## 2. Webhook Verification (GET)
```typescript
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const mode = params.get('hub.mode');
  const token = params.get('hub.verify_token');
  const challenge = params.get('hub.challenge');
  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new Response(challenge, { status: 200 });
  }
  return new Response('Forbidden', { status: 403 });
}
```

## 3. Inbound Message Processing (POST)
- Extract message from `body.entry[0].changes[0].value.messages[0]`.
- Support message types: `text`, `image`, `document`.
- Extract reference code using regex: `/HIFI-[A-Z0-9]{4}/`.
- Match reference code to `custom_designs` table.

## 4. Media Download (Real Binary Stream)
```typescript
// Step 1: Get media URL from Meta
const mediaInfo = await fetch(`https://graph.facebook.com/v17.0/${mediaId}`, {
  headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}` }
}).then(r => r.json());

// Step 2: Download actual binary
const mediaResponse = await fetch(mediaInfo.url, {
  headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}` }
});
const buffer = Buffer.from(await mediaResponse.arrayBuffer());
```
NEVER use mock URLs. NEVER skip the binary download.

## 5. Private Storage Upload
- Upload to PRIVATE `designs` bucket in Supabase Storage.
- Store the file path (NOT public URL) in `custom_designs.design_image_url`.

## 6. Automated Bot Reply
After processing, send confirmation back:
```typescript
await fetch(`https://graph.facebook.com/v17.0/${PHONE_ID}/messages`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    messaging_product: 'whatsapp', to: fromNumber,
    type: 'text', text: { body: `✅ Design received for ${referenceCode}!` }
  })
});
```

## 7. Design Matching Rules
- Never match by filename alone.
- Use: reference_code + customer phone + session.
- Validate the WhatsApp submission belongs to the correct active customization session.
