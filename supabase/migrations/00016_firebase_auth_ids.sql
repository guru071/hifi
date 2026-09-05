-- Firebase user IDs are opaque strings, not UUIDs. The previous UUID foreign
-- key made Firebase profile inserts fail and caused downstream 401/404 errors.
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_auth_id_fkey;

-- Policies that reference users.auth_id must be dropped before changing its type.
DROP POLICY IF EXISTS "users_select_own" ON public.users;
DROP POLICY IF EXISTS "users_update_own" ON public.users;
DROP POLICY IF EXISTS "orders_select_own" ON public.orders;
DROP POLICY IF EXISTS "orders_insert_own" ON public.orders;
DROP POLICY IF EXISTS "order_items_select_own" ON public.order_items;
DROP POLICY IF EXISTS "custom_designs_select_own" ON public.custom_designs;
DROP POLICY IF EXISTS "custom_designs_insert_own" ON public.custom_designs;
DROP POLICY IF EXISTS "product_reviews_select_all" ON public.product_reviews;
DROP POLICY IF EXISTS "product_reviews_insert_own" ON public.product_reviews;
DROP POLICY IF EXISTS "addresses_select_own" ON public.addresses;
DROP POLICY IF EXISTS "addresses_insert_own" ON public.addresses;
DROP POLICY IF EXISTS "addresses_update_own" ON public.addresses;
DROP POLICY IF EXISTS "addresses_delete_own" ON public.addresses;
DROP POLICY IF EXISTS "payments_select_own" ON public.payments;
DROP POLICY IF EXISTS "invoices_select_own" ON public.invoices;
DROP POLICY IF EXISTS "audit_logs_select_admin" ON public.audit_logs;
DROP POLICY IF EXISTS "whatsapp_logs_select_admin" ON public.whatsapp_logs;

ALTER TABLE public.users
  ALTER COLUMN auth_id TYPE TEXT USING auth_id::TEXT;

-- auth.uid() returns UUID for legacy Supabase sessions; cast it for text links.
CREATE POLICY "users_select_own" ON public.users
  FOR SELECT USING (auth_id = auth.uid()::TEXT);
CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE USING (auth_id = auth.uid()::TEXT) WITH CHECK (auth_id = auth.uid()::TEXT);
CREATE POLICY "orders_select_own" ON public.orders FOR SELECT USING (user_id IN (
  SELECT id FROM public.users WHERE auth_id = auth.uid()::TEXT
));
CREATE POLICY "orders_insert_own" ON public.orders FOR INSERT WITH CHECK (user_id IN (
  SELECT id FROM public.users WHERE auth_id = auth.uid()::TEXT
));
CREATE POLICY "order_items_select_own" ON public.order_items FOR SELECT USING (order_id IN (
  SELECT o.id FROM public.orders o JOIN public.users u ON u.id = o.user_id
  WHERE u.auth_id = auth.uid()::TEXT
));
CREATE POLICY "custom_designs_select_own" ON public.custom_designs FOR SELECT USING (user_id IN (
  SELECT id FROM public.users WHERE auth_id = auth.uid()::TEXT
));
CREATE POLICY "custom_designs_insert_own" ON public.custom_designs FOR INSERT WITH CHECK (user_id IN (
  SELECT id FROM public.users WHERE auth_id = auth.uid()::TEXT
));

CREATE POLICY "product_reviews_select_all" ON public.product_reviews
  FOR SELECT USING (is_visible = true OR user_id IN (
    SELECT id FROM public.users WHERE auth_id = auth.uid()::TEXT
  ));
CREATE POLICY "product_reviews_insert_own" ON public.product_reviews
  FOR INSERT WITH CHECK (user_id IN (
    SELECT id FROM public.users WHERE auth_id = auth.uid()::TEXT
  ));

CREATE POLICY "addresses_select_own" ON public.addresses
  FOR SELECT USING (user_id IN (
    SELECT id FROM public.users WHERE auth_id = auth.uid()::TEXT
  ));
CREATE POLICY "addresses_insert_own" ON public.addresses
  FOR INSERT WITH CHECK (user_id IN (
    SELECT id FROM public.users WHERE auth_id = auth.uid()::TEXT
  ));
CREATE POLICY "addresses_update_own" ON public.addresses
  FOR UPDATE USING (user_id IN (
    SELECT id FROM public.users WHERE auth_id = auth.uid()::TEXT
  )) WITH CHECK (user_id IN (
    SELECT id FROM public.users WHERE auth_id = auth.uid()::TEXT
  ));
CREATE POLICY "addresses_delete_own" ON public.addresses
  FOR DELETE USING (user_id IN (
    SELECT id FROM public.users WHERE auth_id = auth.uid()::TEXT
  ));

CREATE POLICY "payments_select_own" ON public.payments
  FOR SELECT USING (order_id IN (
    SELECT o.id FROM public.orders o
    JOIN public.users u ON u.id = o.user_id
    WHERE u.auth_id = auth.uid()::TEXT
  ));

CREATE POLICY "invoices_select_own" ON public.invoices
  FOR SELECT USING (order_id IN (
    SELECT o.id FROM public.orders o
    JOIN public.users u ON u.id = o.user_id
    WHERE u.auth_id = auth.uid()::TEXT
  ));

CREATE POLICY "audit_logs_select_admin" ON public.audit_logs
  FOR SELECT USING (
    auth.uid()::TEXT IN (
      SELECT auth_id FROM public.users WHERE role = 'admin'
    )
  );

CREATE POLICY "whatsapp_logs_select_admin" ON public.whatsapp_logs
  FOR SELECT USING (
    auth.uid()::TEXT IN (
      SELECT auth_id FROM public.users WHERE role = 'admin'
    )
  );
