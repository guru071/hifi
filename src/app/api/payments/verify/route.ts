import { NextResponse } from 'next/server';
import { createServerClient, createRouteClient } from '@/lib/supabase/server';
import { verifyPaymentSignature, generateInvoice } from '@/lib/services/payments';
import { getProfileByAuthId } from '@/lib/services/users';
import { logAudit } from '@/lib/services/audit';
import { notifyAdminNewOrder, notifyCustomerOrderConfirmation } from '@/lib/services/whatsapp-notifications';

export async function POST(request: Request) {
  const supabase = createServerClient();

  try {
    const formData = await request.formData();
    const razorpay_payment_id = formData.get('razorpay_payment_id') as string;
    const razorpay_order_id = formData.get('razorpay_order_id') as string;
    const razorpay_signature = formData.get('razorpay_signature') as string;
    const orderId = formData.get('orderId') as string;
    const designFile = formData.get('design_file') as File | null;

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature || !orderId) {
      return NextResponse.json({ error: 'Missing payment verification fields' }, { status: 400 });
    }

    // 1. Verify the caller owns this order (session-based, never trust client id)
    const routeClient = await createRouteClient();
    const {
      data: { user: authUser },
    } = await routeClient.auth.getUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const profile = await getProfileByAuthId(authUser.id, supabase);
    if (!profile) {
      return NextResponse.json({ error: 'Account profile not found' }, { status: 404 });
    }

    const { data: order } = await supabase.from('orders').select('*').eq('id', orderId).maybeSingle();
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    if (order.user_id !== profile.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 2. Verify the Razorpay signature (timing-safe)
    const valid = verifyPaymentSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);
    if (!valid) return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 });

    // 3. Mark paid (idempotent status transition)
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        status: 'paid',
        payment_status: 'paid',
        payment_id: razorpay_payment_id,
        razorpay_payment_id,
        razorpay_order_id,
      })
      .eq('id', orderId);

    if (updateError) {
      console.error('Failed to update order status:', updateError);
      return NextResponse.json({ error: 'Payment verified but failed to update order' }, { status: 500 });
    }

    // 4. Record payment + generate invoice from snapshot
    await supabase.from('payments').upsert(
      {
        order_id: orderId,
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        amount: order.total_amount,
        currency: order.currency || 'INR',
        status: 'captured',
        paid_at: new Date().toISOString(),
      },
      { onConflict: 'razorpay_payment_id' }
    );
    await generateInvoice(orderId, supabase);

    await logAudit(
      {
        actorUserId: profile.id,
        actorRole: profile.role ?? 'customer',
        action: 'payment.verified',
        entityType: 'order',
        entityId: orderId,
        after: { razorpay_payment_id },
      },
      supabase
    );

    // 5. Fire-and-forget WhatsApp notifications (don't block response)
    notifyAdminNewOrder(orderId).catch(err => console.error('[WA] Admin notify failed:', err));
    notifyCustomerOrderConfirmation(orderId).catch(err => console.error('[WA] Customer notify failed:', err));

    // 6. Handle custom design upload if present
    if (designFile) {
      try {
        const referenceCode = "HIFI-" + Math.random().toString(36).substring(2, 6).toUpperCase();
        const extension = designFile.name.split('.').pop() || 'jpg';
        const fileName = `${referenceCode.replace(/[^A-Z0-9-]/g, '_')}_${Date.now()}.${extension}`;
        const arrayBuffer = await designFile.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const { error: storageError } = await supabase.storage
          .from('designs')
          .upload(fileName, buffer, { 
            contentType: designFile.type || 'image/jpeg',
            upsert: false 
          });

        if (!storageError) {
          const { data: newDesign } = await supabase
            .from('custom_designs')
            .insert({
              user_id: profile.id,
              reference_code: referenceCode,
              status: 'received',
              media_url: fileName,
              design_image_url: fileName,
              media_mime_type: designFile.type
            })
            .select('id')
            .single();

          if (newDesign?.id) {
            // Link this design to all order items in this order
            // In a real scenario, this might need more granular item mapping, but we assume it applies to the whole order.
            await supabase
              .from('order_items')
              .update({ custom_design_id: newDesign.id })
              .eq('order_id', orderId);
          }
        } else {
          console.error("Storage error during design upload:", storageError);
        }
      } catch (uploadError) {
        console.error("Failed to process design file:", uploadError);
      }
    }

    return NextResponse.json({ success: true, message: 'Payment verified successfully' }, { status: 200 });
  } catch (error) {
    console.error('Server error verifying payment:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}