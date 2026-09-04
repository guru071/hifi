-- 00011_analytics_inventory_fixes.sql
-- Analytics dimensions, review moderation, and inventory RPC fixes.

-- 1. Fix product_variants: it had no updated_at but decrement_inventory sets it
ALTER TABLE public.product_variants
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 2. Review moderation
ALTER TABLE public.product_reviews
  ADD COLUMN IF NOT EXISTS is_visible BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Public can only see approved (visible) reviews
DROP POLICY IF EXISTS "product_reviews_select_all" ON public.product_reviews;
CREATE POLICY "product_reviews_select_all" ON public.product_reviews
  FOR SELECT USING (is_visible = true OR user_id IN (
    SELECT id FROM public.users WHERE auth_id = auth.uid()
  ));

-- 3. Improved atomic inventory decrement (returns whether it succeeded + new stock)
DROP FUNCTION IF EXISTS decrement_inventory(UUID, INT);
CREATE OR REPLACE FUNCTION decrement_inventory(variant_id UUID, quantity INT)
RETURNS TABLE (success BOOLEAN, stock_remaining INT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_stock INT;
BEGIN
  SELECT inventory_count INTO current_stock
    FROM product_variants
   WHERE id = variant_id
     FOR UPDATE;

  IF current_stock IS NULL THEN
    RETURN QUERY SELECT false::BOOLEAN, NULL::INT;
    RETURN;
  END IF;

  IF current_stock < quantity THEN
    RETURN QUERY SELECT false::BOOLEAN, current_stock::INT;
    RETURN;
  END IF;

  UPDATE product_variants
     SET inventory_count = inventory_count - quantity,
         updated_at = NOW()
   WHERE id = variant_id;

  RETURN QUERY SELECT true::BOOLEAN, (current_stock - quantity)::INT;
END;
$$;

-- 4. Restock / restore inventory (used on cancellation or failed payment)
CREATE OR REPLACE FUNCTION restock_inventory(variant_id UUID, quantity INT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE product_variants
     SET inventory_count = inventory_count + quantity,
         updated_at = NOW()
   WHERE id = variant_id;
END;
$$;

-- 5. Analytics indexes for high-volume queries
CREATE INDEX IF NOT EXISTS idx_analytics_created ON public.analytics_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_type ON public.analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_product ON public.analytics_events(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product_visible ON public.product_reviews(product_id) WHERE is_visible = true;

-- 6. Product search index (case-insensitive)
CREATE INDEX IF NOT EXISTS idx_products_title ON public.products USING gin (to_tsvector('simple', title || ' ' || coalesce(description, '') || ' ' || coalesce(subtitle, '')));
CREATE INDEX IF NOT EXISTS idx_products_active ON public.products(is_active);
