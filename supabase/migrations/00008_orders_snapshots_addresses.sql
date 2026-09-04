-- 00008_orders_snapshots_addresses.sql
-- Order price snapshots, payment metadata, and a customer address book.

-- 1. Fix the orders status CHECK to include the full real lifecycle
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_status_check
  CHECK (status IN ('pending', 'pending_payment', 'paid', 'processing', 'shipped',
                    'delivered', 'cancelled', 'refunded'));

-- 2. Snapshot + payment metadata columns
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS subtotal_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'INR',
  ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'unpaid',
  ADD COLUMN IF NOT EXISTS razorpay_order_id TEXT,
  ADD COLUMN IF NOT EXISTS razorpay_payment_id TEXT,
  ADD COLUMN IF NOT EXISTS delivery_mode TEXT NOT NULL DEFAULT 'global',
  ADD COLUMN IF NOT EXISTS items_snapshot JSONB,
  ADD COLUMN IF NOT EXISTS customer_email TEXT,
  ADD COLUMN IF NOT EXISTS customer_name TEXT;

ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_payment_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_payment_status_check
  CHECK (payment_status IN ('unpaid', 'pending', 'paid', 'failed', 'refunded'));

-- 3. Backfill existing rows (subtotal defaults, shipping snapshot already present)
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS delivery_fee DECIMAL(10, 2);
UPDATE public.orders SET delivery_fee = shipping_fee WHERE delivery_fee IS NULL;
UPDATE public.orders SET subtotal_amount = total_amount - shipping_fee WHERE subtotal_amount = 0 AND total_amount >= shipping_fee;

-- 4. Address book
CREATE TABLE IF NOT EXISTS public.addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    label TEXT,                       -- Home / Work / etc
    full_name TEXT,
    phone TEXT,
    line1 TEXT NOT NULL,
    line2 TEXT,
    city TEXT NOT NULL,
    state TEXT,
    postal_code TEXT,
    country TEXT NOT NULL DEFAULT 'India',
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_addresses_user ON public.addresses(user_id);

ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "addresses_select_own" ON public.addresses
  FOR SELECT USING (user_id IN (
    SELECT id FROM public.users WHERE auth_id = auth.uid()
  ));
CREATE POLICY "addresses_insert_own" ON public.addresses
  FOR INSERT WITH CHECK (user_id IN (
    SELECT id FROM public.users WHERE auth_id = auth.uid()
  ));
CREATE POLICY "addresses_update_own" ON public.addresses
  FOR UPDATE USING (user_id IN (
    SELECT id FROM public.users WHERE auth_id = auth.uid()
  )) WITH CHECK (user_id IN (
    SELECT id FROM public.users WHERE auth_id = auth.uid()
  ));
CREATE POLICY "addresses_delete_own" ON public.addresses
  FOR DELETE USING (user_id IN (
    SELECT id FROM public.users WHERE auth_id = auth.uid()
  ));

-- 5. FKs/profile refs for orders snapshots
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_address_id UUID REFERENCES public.addresses(id) ON DELETE SET NULL;
