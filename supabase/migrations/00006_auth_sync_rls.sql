-- 00006_auth_sync_rls.sql
-- Link public.users to auth.users via trigger; enable Row Level Security.
-- Existing public.users rows keep their own id but gain an auth_id link so
-- RLS can match auth.uid() to the application profile.

-- 1. Add auth_id link column
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS auth_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. Backfill existing seeded users from auth
UPDATE public.users u
  SET auth_id = a.id
  FROM auth.users a
  WHERE u.auth_id IS NULL AND lower(u.email) = lower(a.email);

-- 3. Auto-provision a public.users row on every new auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (auth_id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    CASE
      WHEN lower(NEW.email) = 'admin@hificustoms.com' THEN 'admin'
      ELSE 'customer'
    END
  )
  ON CONFLICT (auth_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. updated_at helper trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Attach updated_at triggers (idempotent via DO block)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'users_updated_at') THEN
    CREATE TRIGGER users_updated_at BEFORE UPDATE ON public.users
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'products_updated_at') THEN
    CREATE TRIGGER products_updated_at BEFORE UPDATE ON public.products
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'orders_updated_at') THEN
    CREATE TRIGGER orders_updated_at BEFORE UPDATE ON public.orders
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'custom_designs_updated_at') THEN
    CREATE TRIGGER custom_designs_updated_at BEFORE UPDATE ON public.custom_designs
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;

-- 5. Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_designs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_settings ENABLE ROW LEVEL SECURITY;

-- 5.1 users: read/update own row (anon can read nothing; admin via service role)
CREATE POLICY "users_select_own" ON public.users
  FOR SELECT USING (auth_id = auth.uid());
CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE USING (auth_id = auth.uid()) WITH CHECK (auth_id = auth.uid());

-- 5.2 products + variants: public read of active products; admin writes via service role
CREATE POLICY "products_read_active" ON public.products
  FOR SELECT USING (is_active = true);
CREATE POLICY "product_variants_read_active" ON public.product_variants
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.products p WHERE p.id = product_variants.product_id AND p.is_active = true
  ));

-- 5.3 orders: owner read/insert/update via auth_id link on public.users
CREATE POLICY "orders_select_own" ON public.orders
  FOR SELECT USING (user_id IN (
    SELECT id FROM public.users WHERE auth_id = auth.uid()
  ));
CREATE POLICY "orders_insert_own" ON public.orders
  FOR INSERT WITH CHECK (user_id IN (
    SELECT id FROM public.users WHERE auth_id = auth.uid()
  ));

-- 5.4 order_items: only when owner of parent order
CREATE POLICY "order_items_select_own" ON public.order_items
  FOR SELECT USING (order_id IN (
    SELECT o.id FROM public.orders o
    JOIN public.users u ON u.id = o.user_id
    WHERE u.auth_id = auth.uid()
  ));

-- 5.5 custom_designs: owner read/write
CREATE POLICY "custom_designs_select_own" ON public.custom_designs
  FOR SELECT USING (user_id IN (
    SELECT id FROM public.users WHERE auth_id = auth.uid()
  ));
CREATE POLICY "custom_designs_insert_own" ON public.custom_designs
  FOR INSERT WITH CHECK (user_id IN (
    SELECT id FROM public.users WHERE auth_id = auth.uid()
  ));

-- 5.6 product_reviews: owner read; insert with owner check (purchase validation in app layer)
CREATE POLICY "product_reviews_select_all" ON public.product_reviews
  FOR SELECT USING (true);
CREATE POLICY "product_reviews_insert_own" ON public.product_reviews
  FOR INSERT WITH CHECK (user_id IN (
    SELECT id FROM public.users WHERE auth_id = auth.uid()
  ));

-- 5.7 analytics_events: anon can insert (client tracking)
CREATE POLICY "analytics_insert_anon" ON public.analytics_events
  FOR INSERT WITH CHECK (true);

-- 5.8 delivery_settings: public read of delivery config for cart calc
CREATE POLICY "delivery_settings_select_public" ON public.delivery_settings
  FOR SELECT USING (true);
