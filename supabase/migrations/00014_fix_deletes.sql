-- Fix foreign keys to allow product deletion
ALTER TABLE public.order_items DROP CONSTRAINT IF EXISTS order_items_product_variant_id_fkey;
ALTER TABLE public.order_items ADD CONSTRAINT order_items_product_variant_id_fkey FOREIGN KEY (product_variant_id) REFERENCES public.product_variants(id) ON DELETE SET NULL;

ALTER TABLE public.analytics_events DROP CONSTRAINT IF EXISTS analytics_events_product_id_fkey;
ALTER TABLE public.analytics_events ADD CONSTRAINT analytics_events_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL;
