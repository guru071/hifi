import { createServerClient } from '@/lib/supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js';

export type DeliverySettings = {
  type: 'global' | 'per_product';
  fee: number;
  free_shipping_threshold: number;
};

const DEFAULT_DELIVERY: DeliverySettings = {
  type: 'global',
  fee: 15,
  free_shipping_threshold: 150,
};

/**
 * Fetch the global delivery configuration from delivery_settings.
 * Key 'global_delivery' holds the JSON config object.
 */
export async function getDeliverySettings(supabase?: SupabaseClient) {
  const client = supabase ?? createServerClient();
  const { data } = await client.from('delivery_settings').select('*');
  const record = data?.find((s) => s.setting_key === 'global_delivery');
  if (!record) return DEFAULT_DELIVERY;
  const val = record.setting_value as unknown as Partial<DeliverySettings>;
  return {
    type: val?.type === 'per_product' ? ('per_product' as const) : ('global' as const),
    fee: Number(val?.fee) || DEFAULT_DELIVERY.fee,
    free_shipping_threshold: Number(val?.free_shipping_threshold) || DEFAULT_DELIVERY.free_shipping_threshold,
  };
}

/**
 * Compute the correct delivery fee for an order server-side.
 * GLOBAL: fixed fee unless the order subtotal meets/passes the free-shipping threshold.
 * PER_PRODUCT: the maximum per-product delivery fee across ordered items.
 *
 * @param subtotal        Server-computed order subtotal.
 * @param productIds      Product ids in the order (for PER_PRODUCT fee lookup).
 */
export async function computeDeliveryFee(subtotal: number, productIds: string[], supabase?: SupabaseClient) {
  const client = supabase ?? createServerClient();
  const config = await getDeliverySettings(client);

  // Free shipping threshold applies universally
  if (config.free_shipping_threshold > 0 && subtotal >= config.free_shipping_threshold) {
    return 0;
  }

  if (productIds.length === 0) return 0;

  // Always fetch products to check for custom overrides
  const { data: products } = await client
    .from('products')
    .select('id, delivery_fee')
    .in('id', productIds);

  let maxFee = 0;
  let hasOverride = false;

  (products ?? []).forEach(p => {
    if (p.delivery_fee !== null) {
      hasOverride = true;
      maxFee = Math.max(maxFee, Number(p.delivery_fee));
    }
  });

  // If any product has a specific fee (0 or custom), use the highest custom fee.
  if (hasOverride) {
    return maxFee;
  }

  // Fallback to global fee
  return config.fee;
}