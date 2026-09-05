import type { Database, Json } from '@/types/supabase';

type Row<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];

export type UserRow = Row<'users'>;
export type CategoryRow = Row<'categories'>;
export type ProductRow = Row<'products'>;
export type ProductImageRow = Row<'product_images'>;
export type ProductVariantRow = Row<'product_variants'>;
export type CustomDesignRow = Row<'custom_designs'>;
export type OrderRow = Row<'orders'>;
export type OrderItemRow = Row<'order_items'>;
export type AddressRow = Row<'addresses'>;
export type PaymentRow = Row<'payments'>;
export type InvoiceRow = Row<'invoices'>;
export type DeliverySettingRow = Row<'delivery_settings'>;
export type ProductReviewRow = Row<'product_reviews'>;
export type AnalyticsEventRow = Row<'analytics_events'>;
export type WhatsappLogRow = Row<'whatsapp_logs'>;
export type AuditLogRow = Row<'audit_logs'>;

export type OrderWithUsers = OrderRow & { users?: Pick<UserRow, 'id' | 'full_name' | 'email' | 'phone' | 'role'> | null };
export type OrderWithItems = OrderRow & { order_items?: OrderItemRow[] | null; users?: Pick<UserRow, 'full_name' | 'email'> | null };
export type ProductReviewWithUser = ProductReviewRow & { users?: Pick<UserRow, 'full_name' | 'email'> | null };
export type CustomDesignWithUser = CustomDesignRow & { users?: Pick<UserRow, 'full_name' | 'email'> | null };
export type AuditLogWithUser = AuditLogRow & { users?: Pick<UserRow, 'full_name' | 'email'> | null };

export type OrderStatus = NonNullable<OrderRow['status']>;
export type PaymentStatus = NonNullable<OrderRow['payment_status']>;
export type ReviewStatus = NonNullable<CustomDesignRow['status']>;

export type ItemSnapshot = {
  product_id: string;
  product_variant_id?: string | null;
  title?: string | null;
  color?: string | null;
  size?: string | null;
  quantity: number;
  unit_price: number;
  total_price?: number | null;
  design_id?: string | null;
};

export type ShippingAddress = {
  full_name?: string | null;
  phone?: string | null;
  line1?: string | null;
  line2?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  country?: string | null;
};

export function parseItemsSnapshot(snapshot: Json | null): ItemSnapshot[] {
  if (!snapshot || !Array.isArray(snapshot)) return [];
  return snapshot as unknown as ItemSnapshot[];
}

export function parseShippingAddress(addr: Json | null): ShippingAddress | null {
  if (!addr || typeof addr !== 'object' || Array.isArray(addr)) return null;
  return addr as unknown as ShippingAddress;
}

export function isOrderStatus(v: unknown): v is OrderStatus {
  return ['pending', 'pending_payment', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'].includes(v as string);
}
