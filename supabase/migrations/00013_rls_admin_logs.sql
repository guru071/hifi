-- 00013_rls_admin_logs.sql
-- Explicit RLS policies for audit/WhatsApp log tables.
--
-- These tables are written and read exclusively through the service-role client,
-- which bypasses RLS. RLS is enabled so the anon/authenticated roles can never
-- touch them directly. This migration adds explicit READ policies for admin
-- users (linked via public.users.role = 'admin') so the authenticated role can
-- also read them if a route-level client is ever used, and to document intent.
-- No INSERT/UPDATE/DELETE policies are granted: those remain service-role only.

-- 1. audit_logs: admins may read all entries
CREATE POLICY "audit_logs_select_admin" ON public.audit_logs
  FOR SELECT USING (
    auth.uid() IN (
      SELECT auth_id FROM public.users WHERE role = 'admin'
    )
  );

-- 2. whatsapp_logs: admins may read all entries
CREATE POLICY "whatsapp_logs_select_admin" ON public.whatsapp_logs
  FOR SELECT USING (
    auth.uid() IN (
      SELECT auth_id FROM public.users WHERE role = 'admin'
    )
  );
