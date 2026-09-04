-- Add delivery_fee to products table for PER_PRODUCT delivery mode
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS delivery_fee DECIMAL(10, 2) DEFAULT 10.00;
