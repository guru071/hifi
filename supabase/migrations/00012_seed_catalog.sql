-- 00012_seed_catalog.sql
-- Seed categories, attach existing products, and populate product images.

INSERT INTO public.categories (id, name, slug, description, sort_order, is_active) VALUES
('99999999-0000-0000-0000-000000000001', 'T-Shirts', 't-shirts', 'Classic and modern tees in premium cotton.', 1, true),
('99999999-0000-0000-0000-000000000002', 'Oversized', 'oversized', 'Relaxed, streetwear-inspired fits.', 2, true),
('99999999-0000-0000-0000-000000000003', 'Premium', 'premium', 'Our heaviest, most premium garments.', 3, true)
ON CONFLICT (slug) DO NOTHING;

-- Map seeded products to the T-Shirts category
UPDATE public.products
  SET category_id = '99999999-0000-0000-0000-000000000001'
  WHERE category_id IS NULL AND category = 'T-Shirts';

-- Product images (hero = reuse the product image_url)
INSERT INTO public.product_images (product_id, url, alt, sort_order, is_hero)
SELECT p.id, p.image_url, p.title, 0, true
FROM public.products p
WHERE p.image_url IS NOT NULL
ON CONFLICT DO NOTHING;
