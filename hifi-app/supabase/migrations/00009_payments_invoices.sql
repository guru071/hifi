-- 00009_payments_invoices.sql
-- Payment records (idempotent webhook log) and invoices generated from order snapshots.

-- 1. Payments table (one record per Razorpay payment event; idempotency enforced)
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    razorpay_order_id TEXT,
    razorpay_payment_id TEXT,
    razorpay_signature TEXT,
    amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'INR',
    status TEXT NOT NULL DEFAULT 'pending'
      CHECK (status IN ('pending', 'authorized', 'captured', 'failed', 'refunded')),
    event_id TEXT,                      -- Razorpay webhook event id for idempotency
    method TEXT,
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (razorpay_payment_id)
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_event_id ON public.payments(event_id);

-- 2. Invoices (generated from the order snapshot at capture time)
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_number TEXT NOT NULL UNIQUE,
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id),
    subtotal DECIMAL(10, 2) NOT NULL,
    delivery_fee DECIMAL(10, 2) NOT NULL DEFAULT 0,
    total DECIMAL(10, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'INR',
    status TEXT NOT NULL DEFAULT 'paid'
      CHECK (status IN ('paid', 'refunded', 'void')),
    gst_percent DECIMAL(5, 2) NOT NULL DEFAULT 0,
    gst_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
    items_snapshot JSONB,
    billing_address JSONB,
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoices_order ON public.invoices(order_id);
CREATE INDEX IF NOT EXISTS idx_invoices_user ON public.invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_order ON public.payments(order_id);

-- 3. RLS
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payments_select_own" ON public.payments
  FOR SELECT USING (order_id IN (
    SELECT o.id FROM public.orders o
    JOIN public.users u ON u.id = o.user_id
    WHERE u.auth_id = auth.uid()
  ));

CREATE POLICY "invoices_select_own" ON public.invoices
  FOR SELECT USING (order_id IN (
    SELECT o.id FROM public.orders o
    JOIN public.users u ON u.id = o.user_id
    WHERE u.auth_id = auth.uid()
  ));
