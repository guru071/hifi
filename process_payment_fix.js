const fs = require('fs');
let code = fs.readFileSync('src/lib/services/payments.ts', 'utf8');

code = code.replace(
  /export async function processPaymentEvent\(\n\s*eventId: string,\n\s*payload: \{ entity: \{ id: string; order_id: string; amount: number; status: string \} \},\n\s*supabase\?: SupabaseClient\n\) \{/,
  `export async function processPaymentEvent(
  eventId: string,
  payload: { entity: any },
  isPaymentLink: boolean = false,
  supabase?: SupabaseClient
) {`
);

const newLogic = `
  const client = supabase ?? createServerClient();
  const entity = payload.entity;

  if (isPaymentLink) {
    const notes = entity.notes || {};
    if (!notes.product_id) return { success: false, reason: 'no_product_id_in_notes' };
    
    // Create the order now that payment is successful
    const { data: userProfile } = await client.from('users').select('id').eq('phone', notes.sender_phone).maybeSingle();
    const { data: newOrder, error: orderError } = await client.from('orders').insert({
      user_id: userProfile?.id || null,
      total_amount: entity.amount / 100,
      currency: 'INR',
      status: 'processing',
      payment_status: 'paid',
      shipping_fee: 0,
      razorpay_order_id: entity.order_id || 'payment_link_order',
    }).select('id').single();

    if (newOrder && !orderError) {
      await client.from('order_items').insert({
        order_id: newOrder.id,
        product_variant_id: notes.variant_id || null,
        quantity: parseInt(notes.quantity || '1', 10),
        unit_price: (entity.amount / 100) / parseInt(notes.quantity || '1', 10),
      });
      
      await client.from('payments').insert({
        razorpay_order_id: entity.order_id || 'payment_link_order',
        razorpay_payment_id: entity.id || eventId,
        amount: entity.amount / 100,
        currency: 'INR',
        status: 'captured',
        event_id: eventId,
        paid_at: new Date().toISOString(),
      });
    }
    return { success: true };
  }

  const existing = await client
`;

code = code.replace(/  const client = supabase \?\? createServerClient\(\);\n  const entity = payload\.entity;\n\n  const existing = await client/, newLogic);

fs.writeFileSync('src/lib/services/payments.ts', code);
