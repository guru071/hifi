import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import {
  verifyWhatsAppSignature,
  downloadWhatsAppMedia,
  sendWhatsAppMessage,
  logWhatsAppMessage,
} from '@/lib/services/whatsapp';

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get('x-hub-signature-256');

  if (!verifyWhatsAppSignature(rawBody, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
  }

  try {
    const body = JSON.parse(rawBody);

    if (body.object !== 'whatsapp_business_account') {
      return NextResponse.json({ success: true }, { status: 200 });
    }

    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const messages = value?.messages;

    // Handle status updates (delivered/read) — log but don't reprocess
    if (value?.statuses?.length) {
      for (const status of value.statuses) {
        await logWhatsAppMessage({
          direction: 'outbound',
          waMessageId: status.id ?? null,
          status: status.status ?? null,
          payload: status,
        }).catch(() => {});
      }
      return NextResponse.json({ success: true }, { status: 200 });
    }

    if (!messages || messages.length === 0) {
      return NextResponse.json({ success: true }, { status: 200 });
    }

    const message = messages[0];
    const messageId = String(message.id);
    const fromNumber = String(message.from);

    let text = '';
    let mediaId: string | null = null;
    let mediaMime: string | null = null;

    if (message.type === 'text') {
      text = message.text.body;
    } else if (message.type === 'image') {
      text = message.image.caption || '';
      mediaId = message.image.id;
      mediaMime = message.image.mime_type || null;
    } else if (message.type === 'document') {
      text = message.document.caption || '';
      mediaId = message.document.id;
    }

    const supabase = createServerClient();

    // Check if message is from Admin
    const adminPhone = process.env.ADMIN_PHONE_NUMBER;
    if (adminPhone && fromNumber === adminPhone) {
      // It's an admin message for Product Creation
      if (!mediaId) {
        await sendWhatsAppMessage(
          fromNumber,
          'Please attach an image with a caption (e.g. "Cool Shirt 499") to create a product.'
        );
        return NextResponse.json({ success: true }, { status: 200 });
      }

      const caption = text.trim();
      const priceMatch = caption.match(/(\d+(?:\.\d+)?)\s*$/);
      let price = 0;
      let title = caption;
      if (priceMatch) {
        price = parseFloat(priceMatch[1]);
        title = caption.slice(0, priceMatch.index).trim();
      }
      if (!title) title = 'New Product';

      let finalImageUrl: string | null = null;
      try {
        const { buffer, mimeType } = await downloadWhatsAppMedia(mediaId);
        const extension = mimeType.split('/')[1] || 'jpg';
        const fileName = `admin_product_${Date.now()}.${extension}`;
        const { error: storageError } = await supabase.storage
          .from('products')
          .upload(fileName, buffer, { contentType: mimeType, upsert: false });

        if (!storageError) {
          finalImageUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/products/${fileName}`;
        } else {
          console.error('Admin Storage upload failed:', storageError.message);
          await sendWhatsAppMessage(fromNumber, `Failed to upload image: ${storageError.message}`);
          return NextResponse.json({ success: true }, { status: 200 });
        }
      } catch (err) {
        console.error('Admin Media download failure:', err);
        return NextResponse.json({ success: true }, { status: 200 });
      }

      const { error: dbError } = await supabase.from('products').insert({
        title,
        base_price: price,
        image_url: finalImageUrl,
        is_active: true,
      });

      if (dbError) {
        console.error('Admin DB insert failed:', dbError.message);
        await sendWhatsAppMessage(fromNumber, `Failed to create product in DB: ${dbError.message}`);
      } else {
        await sendWhatsAppMessage(
          fromNumber,
          `✅ Product created!\n\nName: ${title}\nPrice: ${price}\nImage: ${finalImageUrl}`
        );
      }
      return NextResponse.json({ success: true }, { status: 200 });
    }

    // Handle HIFI HELP command
    const upperText = text.trim().toUpperCase();
    if (upperText === 'HELP HIFI' || upperText === 'HIFI HELP') {
      const helpMessage = `👋 *Welcome to HIFI!*

Here is what I can do for you:
🎨 *Custom Designs*: Send me a reference code (like HIFI-1234) with your image to get your custom design started!
🛒 *Browse Store*: Visit our website to see all our latest products.
📦 *Order Tracking*: Use your order ID on our website to track your package.

*(For general chat or AI features, just talk to me normally!)*`;
      
      await sendWhatsAppMessage(fromNumber, helpMessage);
      return NextResponse.json({ success: true }, { status: 200 });
    }

    // Find the design by reference code in text/caption
    const match = text.match(/HIFI-[A-Z0-9]{4}/);
    const referenceCode = match?.[0] ?? null;

    let design = null;
    if (referenceCode) {
      const { data } = await supabase
        .from('custom_designs')
        .select('*')
        .eq('reference_code', referenceCode)
        .maybeSingle();
      design = data ?? null;
    }

    // Log the inbound message (idempotent)
    await logWhatsAppMessage({
      direction: 'inbound',
      waMessageId: messageId,
      fromNumber,
      messageType: message.type,
      body: text,
      mediaId,
      status: 'received',
      customDesignId: design?.id ?? null,
      payload: message,
    }).catch((e) => console.error('Failed to log inbound message:', e.message));

    if (!design) {
      // Unknown thread — no reference code.
      // Since Maghgo is the primary receiver and forwards to HIFI, we just drop this to prevent infinite loops.
      return NextResponse.json({ success: true }, { status: 200 });
    }

    // Download + store media
    let finalDesignUrl: string | null = null;
    if (mediaId) {
      try {
        const { buffer, mimeType } = await downloadWhatsAppMedia(mediaId);
        const extension = mimeType.split('/')[1] || 'jpg';
        const fileName = `${design.reference_code.replace(/[^A-Z0-9-]/g, '_')}_${Date.now()}.${extension}`;
        const { error: storageError } = await supabase.storage
          .from('designs')
          .upload(fileName, buffer, { contentType: mimeType, upsert: false });
        if (!storageError) finalDesignUrl = fileName;
        else console.error('Storage upload failed:', storageError.message);
      } catch (err) {
        console.error('Media download failure:', err);
      }
    }

    const { error: updateError } = await supabase
      .from('custom_designs')
      .update({
        status: design.status === 'pending' ? 'received' : design.status,
        whatsapp_message_id: messageId,
        sender_phone: fromNumber,
        media_url: finalDesignUrl ?? design.media_url,
        design_image_url: finalDesignUrl ?? design.design_image_url,
        media_mime_type: mediaMime ?? design.media_mime_type,
        media_caption: text || design.media_caption,
      })
      .eq('id', design.id);

    if (updateError) {
      console.error('Failed to update design:', updateError);
    }

    // Send bot confirmation
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const token = process.env.WHATSAPP_TOKEN;
    if (phoneNumberId && token) {
      try {
        await sendWhatsAppMessage(
          fromNumber,
          `We've received your custom design (${design.reference_code}). Our team is reviewing it and will get back to you shortly!`
        );
      } catch (botError) {
        console.error('Failed to send bot reply:', botError);
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({ error: 'Webhook processing error' }, { status: 400 });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}