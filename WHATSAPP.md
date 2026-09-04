# HIFI WhatsApp Integration

As per Master Rules 25 & 26, HIFI uses a real Meta WhatsApp webhook for custom t-shirt design submissions.

## Design Flow
1. **Customization Request**: User initiates a custom t-shirt design via the UI.
2. **Session Generation**: A unique `design_reference` is generated for the session.
3. **WhatsApp Redirection**: User is provided a `wa.me` link pre-filled with the exact `design_reference` string.
4. **Webhook Interception**: User sends an image to the business number. The Meta webhook hits `POST /api/webhooks/whatsapp`.
5. **Media Processing**: 
   - The payload is verified using the actual webhook signature.
   - The media URL is extracted and streamed to Supabase private storage.
   - The file is associated tightly with the `design_reference` and the user's `session` in the `custom_designs` table.
6. **No Blind Matching**: We explicitly avoid matching uploads simply by "filename". Uploads are anchored contextually to the Meta Message ID and Webhook payload metadata.
