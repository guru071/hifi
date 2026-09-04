-- 00010_whatsapp_audit.sql
-- WhatsApp message log, audit log for admin actions, design workflow enhancements.

-- 1. Design workflow columns
ALTER TABLE public.custom_designs
  ADD COLUMN IF NOT EXISTS sender_phone TEXT,
  ADD COLUMN IF NOT EXISTS media_url TEXT,
  ADD COLUMN IF NOT EXISTS media_mime_type TEXT,
  ADD COLUMN IF NOT EXISTS media_caption TEXT,
  ADD COLUMN IF NOT EXISTS design_name TEXT;

ALTER TABLE public.custom_designs DROP CONSTRAINT IF EXISTS custom_designs_status_check;
ALTER TABLE public.custom_designs ADD CONSTRAINT custom_designs_status_check
  CHECK (status IN ('pending', 'received', 'in_review', 'approved', 'rejected'));

-- 2. WhatsApp message log (inbound + outbound)
CREATE TABLE IF NOT EXISTS public.whatsapp_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
    wa_message_id TEXT,
    from_number TEXT,
    to_number TEXT,
    message_type TEXT,          -- text / image / audio / template
    body TEXT,
    media_id TEXT,
    media_url TEXT,
    status TEXT DEFAULT 'received',
    custom_design_id UUID REFERENCES public.custom_designs(id) ON DELETE SET NULL,
    payload JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_whatsapp_logs_wa_message ON public.whatsapp_logs(wa_message_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_created ON public.whatsapp_logs(created_at DESC);

-- 3. Audit log (admin actions, order/payment mutations)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    actor_role TEXT,
    action TEXT NOT NULL,       -- e.g. 'order.status_updated', 'product.created', 'design.approved'
    entity_type TEXT,
    entity_id TEXT,
    before JSONB,
    after JSONB,
    ip TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);

ALTER TABLE public.whatsapp_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_designs ENABLE ROW LEVEL SECURITY;

-- customers can read their own design submissions via auth link (already own policy on custom_designs)
