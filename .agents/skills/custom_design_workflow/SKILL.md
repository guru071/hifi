---
name: custom_design_workflow
description: End-to-end custom T-shirt design workflow - reference codes, WhatsApp submission, storage, order attachment.
---

# Custom Design Workflow Skill

## 1. Design Reference Code
- Generate unique reference: `HIFI-${4 random uppercase alphanumeric chars}`.
- Example: `HIFI-8X4M`.
- This code links the customer's WhatsApp message to their design session.

## 2. Workflow Steps
```
Customer starts customization → Reference code generated → Stored in custom_designs (status: pending)
→ Customer sends image via WhatsApp with reference code in caption
→ Webhook receives image → Downloads binary from Meta API → Uploads to private storage
→ Updates custom_designs (status: received, design_image_url: private path)
→ Bot sends confirmation → Design attached to order at checkout
```

## 3. Storage Rules
- Original designs stored in PRIVATE Supabase storage bucket.
- Database stores metadata only (file path, not binary).
- Never expose unrestricted public URLs.
- Admin views designs via signed URLs with short expiry.

## 4. Design Matching
- Match by `reference_code` in the caption, NOT by filename.
- Validate the submission belongs to the correct active session.
- Verify customer identity via phone number when possible.

## 5. Status Transitions
```
pending → received → approved → attached_to_order
                   → rejected
```
