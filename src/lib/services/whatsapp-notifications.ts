import { createServerClient } from '@/lib/supabase/server';
import { sendWhatsAppMessage, sendWhatsAppImage, sendWhatsAppCtaUrl, sendWhatsAppFlow } from './whatsapp';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://hificustom.goatech.tech';
const ADMIN_WHATSAPP = process.env.ADMIN_WHATSAPP_NUMBER;

type OrderSnapshot = {
  product_id?: string;
  title?: string;
  color?: string;
  size?: string;
  quantity?: number;
  unit_price?: number;
  design_id?: string;
  variant_sku?: string;
};

/**
 * Notify admin's WhatsApp when a new order is paid.
 */
export async function notifyAdminNewOrder(orderId: string) {
  if (!ADMIN_WHATSAPP) {
    console.warn('[WA-Notify] ADMIN_WHATSAPP_NUMBER not set, skipping admin notification');
    return;
  }

  const supabase = createServerClient();

  const { data: order } = await supabase
    .from('orders')
    .select('*, users (id, full_name, email, phone)')
    .eq('id', orderId)
    .maybeSingle();

  if (!order) {
    console.error('[WA-Notify] Order not found:', orderId);
    return;
  }

  const items = (order.items_snapshot as OrderSnapshot[]) || [];
  const address = parseAddress(order.shipping_address);
  const customer = order.users as { full_name?: string; email?: string; phone?: string } | null;

  const itemLines = items.map((item, i) => {
    const line = `${i + 1}. ${item.title || 'Custom Item'}`;
    const variant = [item.color, item.size].filter(Boolean).join('/');
    return `${line}${variant ? ` (${variant})` : ''} × ${item.quantity} — ₹${Number(item.unit_price || 0) * (item.quantity || 1)}`;
  }).join('\n');

  const msg = `🛒 *NEW ORDER RECEIVED*

*Order:* #${orderId.slice(0, 8).toUpperCase()}
*Customer:* ${customer?.full_name || 'Guest'}
*Email:* ${customer?.email || '—'}
*Phone:* ${customer?.phone || address.phone || '—'}

*Items:*
${itemLines}

*Subtotal:* ₹${order.subtotal_amount}
*Shipping:* ₹${order.shipping_fee || 0}
*Total:* ₹${order.total_amount}

*Ship To:*
${address.full_name || ''}
${address.line1 || ''}${address.line2 ? ', ' + address.line2 : ''}
${address.city || ''}, ${address.state || ''} ${address.postal_code || ''}
${address.country || 'India'}

${items.some(i => i.design_id) ? '⚠️ Custom design(s) attached.' : ''}

View: ${SITE_URL}/admin/orders`;

  try {
    await sendWhatsAppMessage(ADMIN_WHATSAPP, msg);
    console.log('[WA-Notify] Admin notified for order', orderId);

    // If there are custom designs, send the images to the admin
    const designIds = items.map(i => i.design_id).filter(Boolean) as string[];
    if (designIds.length > 0) {
      const { data: designs } = await supabase
        .from('custom_designs')
        .select('design_image_url, reference_code')
        .in('id', designIds);
      
      if (designs && designs.length > 0) {
        for (const design of designs) {
          if (design.design_image_url) {
            let fullUrl = design.design_image_url;
            if (!fullUrl.startsWith('http')) {
              fullUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/designs/${fullUrl}`;
            }
            await sendWhatsAppImage(ADMIN_WHATSAPP, fullUrl, `🎨 Custom Design Ref: ${design.reference_code}`);
            await new Promise(r => setTimeout(r, 500)); // Rate limit
          }
        }
      }
    }
  } catch (err) {
    console.error('[WA-Notify] Failed to notify admin:', err);
  }
}

/**
 * Send order confirmation to customer's WhatsApp.
 */
export async function notifyCustomerOrderConfirmation(orderId: string) {
  const supabase = createServerClient();

  const { data: order } = await supabase
    .from('orders')
    .select('*, users (id, full_name, phone)')
    .eq('id', orderId)
    .maybeSingle();

  if (!order) return;

  const customer = order.users as { full_name?: string; phone?: string } | null;
  const phone = customer?.phone || parseAddress(order.shipping_address).phone;

  if (!phone) {
    console.warn('[WA-Notify] No customer phone for order', orderId);
    return;
  }

  const cleanPhone = phone.replace(/[^0-9]/g, '');
  if (cleanPhone.length < 10) return;

  const items = (order.items_snapshot as OrderSnapshot[]) || [];
  const itemSummary = items.map(i =>
    `• ${i.title || 'Custom Item'}${i.color ? ` (${i.color}/${i.size})` : ''} × ${i.quantity}`
  ).join('\n');

  const msg = `✅ *Order Confirmed — HIFI*

Hi ${customer?.full_name || 'there'}! Your order has been placed successfully.

*Order:* #${orderId.slice(0, 8).toUpperCase()}
*Total:* ₹${order.total_amount}

*Items:*
${itemSummary}

We'll update you when your order ships! 🚀

Track your order: ${SITE_URL}/profile/orders`;

  try {
    await sendWhatsAppMessage(cleanPhone, msg);
    console.log('[WA-Notify] Customer notified for order', orderId);
  } catch (err) {
    console.error('[WA-Notify] Failed to notify customer:', err);
  }
}

/**
 * Send order status update to customer's WhatsApp.
 */
export async function notifyCustomerOrderStatus(orderId: string, newStatus: string) {
  const supabase = createServerClient();

  const { data: order } = await supabase
    .from('orders')
    .select('*, users (id, full_name, phone)')
    .eq('id', orderId)
    .maybeSingle();

  if (!order) return;

  const customer = order.users as { full_name?: string; phone?: string } | null;
  const phone = customer?.phone || parseAddress(order.shipping_address).phone;

  if (!phone) return;
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  if (cleanPhone.length < 10) return;

  const statusEmoji: Record<string, string> = {
    processing: '🔄',
    shipped: '📦',
    delivered: '✅',
    cancelled: '❌',
    refunded: '💰',
  };

  const statusText: Record<string, string> = {
    processing: 'Your order is being prepared!',
    shipped: 'Your order has been shipped! It\'s on its way to you.',
    delivered: 'Your order has been delivered! We hope you love it.',
    cancelled: 'Your order has been cancelled. If you have questions, please contact us.',
    refunded: 'Your refund has been processed. It will reflect in your account soon.',
  };

  const emoji = statusEmoji[newStatus] || '📋';
  const description = statusText[newStatus] || `Status updated to: ${newStatus}`;

  const msg = `${emoji} *Order Update — HIFI*

Hi ${customer?.full_name || 'there'}!

*Order:* #${orderId.slice(0, 8).toUpperCase()}
*Status:* ${newStatus.toUpperCase()}

${description}

Track: ${SITE_URL}/profile/orders`;

  try {
    await sendWhatsAppMessage(cleanPhone, msg);
    console.log('[WA-Notify] Status update sent for order', orderId, '→', newStatus);
  } catch (err) {
    console.error('[WA-Notify] Failed to send status update:', err);
  }
}

/**
 * Send promotional product messages to all customers.
 * Called by the cron job twice a week.
 */
export async function sendProductPromotions() {
  const supabase = createServerClient();

  // Fetch latest active products (max 5)
  const { data: products } = await supabase
    .from('products')
    .select('id, title, base_price, image_url')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(5);

  if (!products || products.length === 0) {
    console.log('[WA-Promo] No active products to promote');
    return { sent: 0, skipped: 0 };
  }

  // Fetch all customers with phone numbers
  const { data: customers } = await supabase
    .from('users')
    .select('id, full_name, phone')
    .eq('role', 'customer')
    .not('phone', 'is', null);

  if (!customers || customers.length === 0) {
    console.log('[WA-Promo] No customers with phone numbers');
    return { sent: 0, skipped: 0 };
  }

  const productList = products.map((p, i) =>
    `${i + 1}. *${p.title}* — ₹${p.base_price}`
  ).join('\n');

  let sent = 0;
  let skipped = 0;

  for (const customer of customers) {
    const phone = customer.phone?.replace(/[^0-9]/g, '');
    if (!phone || phone.length < 10) {
      skipped++;
      continue;
    }

    const msg = `🔥 *New at HIFI!*

Hi ${customer.full_name || 'there'}! Check out our latest products:

${productList}

🛍️ Shop now: ${SITE_URL}/shop

Use code *HIFI10* for 10% off your next order!`;

    try {
      const flowId = process.env.MAGHGO_FLOW_ID;
      const flowScreen = process.env.MAGHGO_FLOW_SCREEN;
      
      if (flowId && flowScreen) {
        // Send native WhatsApp Flow (Interactive GUI)
        const flowData = {
          products: products.map(p => ({
            id: p.id,
            title: p.title,
            price: `₹${p.base_price}`,
            image_url: p.image_url || ''
          }))
        };
        const headerText = `🔥 New at HIFI!`;
        const bodyText = `Hi ${customer.full_name || 'there'}! Check out our latest products.\n\nUse code *HIFI10* for 10% off your next order!`;
        const footerText = `Shop now at HIFI Custom`;
        
        await sendWhatsAppFlow(phone, flowId, flowScreen, bodyText, flowData, headerText, footerText);
        sent++;
        await new Promise(r => setTimeout(r, 500));
      } else {
        // Fallback to standard text + image
        await sendWhatsAppMessage(phone, msg);
        sent++;
        await new Promise(r => setTimeout(r, 500));
        
        // Send first product image if available
        const firstProduct = products[0];
        if (firstProduct?.image_url) {
          try {
            await sendWhatsAppImage(phone, firstProduct.image_url, `${firstProduct.title} — ₹${firstProduct.base_price}`);
          } catch {
            // Non-critical, skip image
          }
        }
      }
    } catch (err) {
      console.error(`[WA-Promo] Failed to send to ${phone}:`, err);
      skipped++;
    }
  }

  console.log(`[WA-Promo] Sent: ${sent}, Skipped: ${skipped}`);
  return { sent, skipped };
}

/**
 * Send welcome message to new users.
 */
export async function sendWelcomeMessage(phone: string, name: string, isNewUser: boolean) {
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  if (cleanPhone.length < 10) return;

  if (isNewUser) {
    const msg = `👋 *Welcome to HIFI!*

Hi ${name}! Thanks for joining HIFI — India's premium custom clothing brand.

🎨 Design your own custom tees, hoodies & more
🚀 Fast delivery across India
💎 Premium quality guaranteed

Start shopping: ${SITE_URL}/shop

Got questions? Just reply to this message!`;

    try {
      await sendWhatsAppMessage(cleanPhone, msg);
    } catch (err) {
      console.error('[WA-Welcome] Failed to send welcome:', err);
    }
  } else {
    // Returning user
    const msg = `👋 *Welcome back to HIFI!*

Hi ${name}! Great to see you again.

🆕 Check out our new arrivals: ${SITE_URL}/shop

We've got fresh designs waiting for you!`;

    try {
      await sendWhatsAppMessage(cleanPhone, msg);
    } catch (err) {
      console.error('[WA-Welcome] Failed to send welcome back:', err);
    }
  }
}

// ─── Helpers ───

function parseAddress(a: unknown): Record<string, string> {
  if (typeof a === 'string') {
    try { return JSON.parse(a); } catch { return {}; }
  }
  return (a || {}) as Record<string, string>;
}
