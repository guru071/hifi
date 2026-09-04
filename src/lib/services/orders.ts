import Razorpay from 'razorpay';
import { createServerClient } from '@/lib/supabase/server';
import { computeDeliveryFee, type DeliverySettings } from '@/lib/services/delivery';
import type { Json } from '@/types/supabase';
import type { SupabaseClient } from '@supabase/supabase-js';

export type OrderItemInput = {
  productId: string;
  variantId?: string | null;
  quantity: number;
  customDesignId?: string | null;
};

export type ShippingAddressInput = {
  full_name?: string;
  phone?: string;
  line1?: string;
  line2?: string | null;
  city?: string;
  state?: string | null;
  postal_code?: string;
  country?: string;
  email?: string;
};

export class OrderCreationError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

/**
 * Create an order entirely server-side: validates items against the DB,
 * computes true prices + delivery fee, stores a price snapshot, decrements
 * inventory atomically, and initializes a Razorpay order.
 *
 * @param profileId  The public.users.id of the authenticated caller (never from client).
 * @param items      Line items with productId/variantId/quantity.
 * @param address    Shipping address object (validated).
 */
export async function createOrder({ profileId, items, address }: { profileId: string; items: OrderItemInput[]; address: ShippingAddressInput }) {
  const supabase = createServerClient();
  const raz = getRazorpay();

  if (!items || items.length === 0) {
    throw new OrderCreationError('Cart is empty', 400);
  }

  const orderItemsToInsert: {
    product_variant_id: string | null;
    custom_design_id: string | null;
    quantity: number;
    unit_price: number;
  }[] = [];

  const snapshotItems: Json[] = [];
  let subtotal = 0;
  const productIds: string[] = [];

  // 1. Server-side price calculation from DB (never trust client price)
  for (const item of items) {
    if (!item.productId || typeof item.quantity !== 'number' || item.quantity <= 0) {
      throw new OrderCreationError('Invalid item payload', 400);
    }

    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, title, base_price, delivery_fee, is_active')
      .eq('id', item.productId)
      .maybeSingle();

    if (productError || !product || product.is_active !== true) {
      throw new OrderCreationError(`Product ${item.productId} not found or inactive`, 404);
    }

    let unitPrice = Number(product.base_price);
    let variant: { id: string; sku: string; color: string; size: string; inventory_count: number | null; price_adjustment: number | null } | null = null;

    if (item.variantId) {
      const { data: v } = await supabase
        .from('product_variants')
        .select('id, sku, color, size, inventory_count, price_adjustment')
        .eq('id', item.variantId)
        .eq('product_id', item.productId)
        .maybeSingle();
      if (!v) {
        throw new OrderCreationError(`Variant ${item.variantId} not found for product`, 404);
      }
      variant = v;
      if (v.price_adjustment) unitPrice += Number(v.price_adjustment);
      if ((v.inventory_count ?? 0) < item.quantity) {
        throw new OrderCreationError(`Insufficient stock for ${product.title} (${v.color}/${v.size})`, 409);
      }
    }

    subtotal += unitPrice * item.quantity;
    productIds.push(item.productId);
    orderItemsToInsert.push({
      product_variant_id: item.variantId ?? null,
      custom_design_id: item.customDesignId ?? null,
      quantity: item.quantity,
      unit_price: unitPrice,
    });

    snapshotItems.push({
      product_id: item.productId,
      title: product.title,
      variant_id: item.variantId ?? null,
      variant_sku: variant?.sku ?? null,
      color: variant?.color ?? null,
      size: variant?.size ?? null,
      quantity: item.quantity,
      unit_price: unitPrice,
      design_id: item.customDesignId ?? null,
    });
  }

  // 2. Delivery fee (GLOBAL vs PER_PRODUCT), server-side
  const shippingFee = await computeDeliveryFee(subtotal, productIds, supabase);
  const deliveryMode = (await getDeliveryMode(supabase));

  // 3. Create the order with a full price snapshot
  const total = subtotal + shippingFee;
  const { data: newOrder, error: orderError } = await supabase
    .from('orders')
    .insert({
      user_id: profileId,
      status: 'pending_payment',
      payment_status: 'pending',
      currency: 'INR',
      total_amount: total,
      subtotal_amount: subtotal,
      shipping_fee: shippingFee,
      delivery_fee: shippingFee,
      delivery_mode: deliveryMode,
      items_snapshot: snapshotItems,
      shipping_address: address as unknown as Json,
    })
    .select()
    .single();

  if (orderError || !newOrder) {
    throw new OrderCreationError(`Failed to create order: ${orderError?.message}`, 500);
  }

  // 4. Atomic inventory deduction with rollback
  const decremented: { variantId: string; quantity: number }[] = [];
  try {
    for (const item of items) {
      if (item.variantId) {
        const { data: rpcRes, error: itError } = await supabase.rpc('decrement_inventory', {
          variant_id: item.variantId,
          quantity: item.quantity,
        });
        if (itError || rpcRes === null || rpcRes[0]?.success !== true) {
          throw new OrderCreationError(`Insufficient stock or concurrent checkout; please refresh and retry.`, 409);
        }
        decremented.push({ variantId: item.variantId, quantity: item.quantity });
      }
    }
  } catch (err) {
    // Roll back inventory + order
    for (const d of decremented) {
      await supabase.rpc('restock_inventory', { variant_id: d.variantId, quantity: d.quantity });
    }
    await supabase.from('orders').delete().eq('id', newOrder.id);
    throw err;
  }

  // 5. Insert order items
  const { error: itemsError } = await supabase.from('order_items').insert(
    orderItemsToInsert.map((i) => ({ ...i, order_id: newOrder.id }))
  );
  if (itemsError) {
    console.error('Failed to insert order items:', itemsError);
    for (const d of decremented) {
      await supabase.rpc('restock_inventory', { variant_id: d.variantId, quantity: d.quantity });
    }
    await supabase.from('orders').delete().eq('id', newOrder.id);
    throw new OrderCreationError('Failed to finalize order', 500);
  }

  // 6. Initialize Razorpay order (amount = smallest unit = paise)
  let razorpayOrderId: string | null = null;
  try {
    const rzpOrder = await raz.orders.create({
      amount: Math.round(total * 100),
      currency: 'INR',
      receipt: `receipt_${newOrder.id}`,
      notes: { order_id: newOrder.id },
    });
    razorpayOrderId = rzpOrder.id;
    await supabase.from('orders').update({ razorpay_order_id: razorpayOrderId }).eq('id', newOrder.id);
  } catch (rzpError) {
    console.error('Razorpay order creation failed:', rzpError);
    return {
      orderId: newOrder.id,
      razorpayOrderId: null,
      amount: total,
      currency: 'INR',
      razorpayInitFailed: true,
    };
  }

  return {
    orderId: newOrder.id,
    razorpayOrderId,
    amount: total,
    currency: 'INR',
    razorpayInitFailed: false,
  };
}

async function getDeliveryMode(supabase: SupabaseClient) {
  const { data } = await supabase.from('delivery_settings').select('*');
  const record = data?.find((s) => s.setting_key === 'global_delivery');
  const val = record?.setting_value as unknown as Partial<DeliverySettings> | null;
  return val?.type === 'per_product' ? 'per_product' : 'global';
}

let razInstance: Razorpay | null = null;
function getRazorpay() {
  if (!razInstance) {
    razInstance = new Razorpay({
      key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });
  }
  return razInstance;
}

export { getRazorpay };