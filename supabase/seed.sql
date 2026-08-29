-- Seed File for Supabase
-- Users
INSERT INTO public.users (id, email, full_name, role) VALUES 
('00000000-0000-0000-0000-000000000001', 'admin@hificustoms.com', 'Admin User', 'admin'),
('00000000-0000-0000-0000-000000000002', 'guest@example.com', 'Guest User', 'customer')
ON CONFLICT DO NOTHING;

-- Products
INSERT INTO public.products (id, title, subtitle, description, base_price, category, image_url, delivery_fee) VALUES
('11111111-1111-1111-1111-111111111111', 'The Core Tee', 'Premium Mid-weight Cotton', 'Our core line of premium, garment-dyed blanks engineered for longevity.', 45.00, 'T-Shirts', 'https://lh3.googleusercontent.com/aida-public/AB6AXuCkIH5H2s-3iI4asIjpRN8S15rimzIsxzGUzTw7cWsdG0lvrxge2rxeaEOhi1eTuQQGlgtGuOIYlhoGI4ZUQS6foK3d48A29VlLMwdr6XdhZgCbIhkuH9WS5JQAPBL5hFjOSOaU1sBpvTzp9m82s-TdUKJxL7IfZlt06U4IPhx2BbngOL8H_Qs2uy0dYOVKNBbOOzk-ioxV6n0_qxIyuSfVQe4eTJgOh5YAZajioLBxj2zni6Coorw1', 10.00),
('22222222-2222-2222-2222-222222222222', 'The Heavyweight', 'Ultra-dense 280gsm Cotton', 'Our premium 280gsm cotton t-shirt with a structured drape and substantial feel.', 55.00, 'T-Shirts', 'https://lh3.googleusercontent.com/aida-public/AB6AXuC6Sq9q_l6p6jWob6alRuI6BOL10IOgXdDkR_W-BAe3JuDLFCVq83l1fr8wjO6QPQ_pakYBBFmQved_peEgT5W-Z60m97cS0sJc6EcrGgxg782Nqbfyk29ihXjgWkZ2m4XJZpqkicM1ZctSyYeWOYMhf4GSA2oHNsSHuDoUfbg0aKDLQsdCu-qqf90mS4D6Uc9zWK00CLYqC86ZdJH4Tl_7h72KDS8kGqT5lSKEEBh_BKH7VFowKf4s', 10.00),
('33333333-3333-3333-3333-333333333333', 'The Boxy Fit', 'Modern Dropped Shoulder', 'Relaxed boxy fit featuring drop shoulders for a contemporary silhouette.', 50.00, 'T-Shirts', 'https://lh3.googleusercontent.com/aida-public/AB6AXuA_bssEqqHIhvK30SV6AYXFMXlFjb_DF6e9JQMjgd9M8kLXpTcB13c5Z-aIRQp6bXxTPJKBxZz8GkmUzvtmNY_H0SeJM4p0x_WIMI3AFTenUwGKX8APTSBICokZX_NiOaoFLmwBhPfXkkHuBjttLwukwz2KeaErH5T9PA5BUl4MftyCJhc5SK5Q-L4Lo49PpAIhp7hN-C0HIs70nOue4pjaTJlUhBdPazE984fzpfgu0w7DNhT75O6Y', 10.00)
ON CONFLICT DO NOTHING;

-- Variants for Core Tee
INSERT INTO public.product_variants (id, product_id, color, size, sku, inventory_count, price_adjustment) VALUES
('a1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Black', 'M', 'CORE-BLK-M', 25, 0.00),
('a1111111-1111-1111-1111-111111111112', '11111111-1111-1111-1111-111111111111', 'Black', 'L', 'CORE-BLK-L', 15, 0.00),
('a1111111-1111-1111-1111-111111111113', '11111111-1111-1111-1111-111111111111', 'White', 'M', 'CORE-WHT-M', 30, 0.00)
ON CONFLICT DO NOTHING;

-- Variants for Heavyweight
INSERT INTO public.product_variants (id, product_id, color, size, sku, inventory_count, price_adjustment) VALUES
('b1111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'Black', 'M', 'HVY-BLK-M', 10, 0.00),
('b1111111-1111-1111-1111-111111111112', '22222222-2222-2222-2222-222222222222', 'Bone', 'L', 'HVY-BNE-L', 5, 0.00)
ON CONFLICT DO NOTHING;

-- Variants for Boxy Fit
INSERT INTO public.product_variants (id, product_id, color, size, sku, inventory_count, price_adjustment) VALUES
('c1111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 'Ash', 'M', 'BOX-ASH-M', 8, 0.00),
('c1111111-1111-1111-1111-111111111112', '33333333-3333-3333-3333-333333333333', 'Navy', 'XL', 'BOX-NVY-XL', 2, 0.00)
ON CONFLICT DO NOTHING;

-- Custom Designs (One Pending, One Received)
INSERT INTO public.custom_designs (id, user_id, reference_code, status, whatsapp_message_id, design_image_url) VALUES
('d1111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000002', 'HIFI-1A2B', 'received', 'wamid.HBg1MjU1NDUyNDM2MzIVAgASGBQ1', 'https://lh3.googleusercontent.com/aida-public/AB6AXuA_bssEqqHIhvK30SV6AYXFMXlFjb_DF6e9JQMjgd9M8kLXpTcB13c5Z-aIRQp6bXxTPJKBxZz8GkmUzvtmNY_H0SeJM4p0x_WIMI3AFTenUwGKX8APTSBICokZX_NiOaoFLmwBhPfXkkHuBjttLwukwz2KeaErH5T9PA5BUl4MftyCJhc5SK5Q-L4Lo49PpAIhp7hN-C0HIs70nOue4pjaTJlUhBdPazE984fzpfgu0w7DNhT75O6Y'),
('d1111111-1111-1111-1111-111111111112', '00000000-0000-0000-0000-000000000002', 'HIFI-3C4D', 'pending', NULL, NULL)
ON CONFLICT DO NOTHING;

-- Orders
INSERT INTO public.orders (id, user_id, status, total_amount, shipping_fee, shipping_address) VALUES
('e1111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000002', 'paid', 105.00, 15.00, '{"name": "Guest User", "city": "Los Angeles"}'),
('e1111111-1111-1111-1111-111111111112', '00000000-0000-0000-0000-000000000002', 'delivered', 50.00, 5.00, '{"name": "Guest User", "city": "New York"}')
ON CONFLICT DO NOTHING;

-- Order Items
INSERT INTO public.order_items (id, order_id, product_variant_id, custom_design_id, quantity, unit_price) VALUES
('f1111111-1111-1111-1111-111111111111', 'e1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'd1111111-1111-1111-1111-111111111111', 2, 45.00),
('f1111111-1111-1111-1111-111111111112', 'e1111111-1111-1111-1111-111111111112', 'c1111111-1111-1111-1111-111111111111', NULL, 1, 50.00)
ON CONFLICT DO NOTHING;

-- Product Reviews
INSERT INTO public.product_reviews (id, product_id, user_id, order_id, rating, comment) VALUES
('f1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000002', 'e1111111-1111-1111-1111-111111111111', 5, 'Absolutely love the core tee. Perfect fit!'),
('f1111111-1111-1111-1111-111111111112', '33333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000002', 'e1111111-1111-1111-1111-111111111112', 4, 'Great boxy fit. Ash color is a bit darker than expected but overall solid.')
ON CONFLICT DO NOTHING;

-- Analytics Events
INSERT INTO public.analytics_events (id, event_type, page_url, user_id, product_id) VALUES
('f1111111-1111-1111-1111-111111111111', 'page_view', '/shop', '00000000-0000-0000-0000-000000000002', NULL),
('f1111111-1111-1111-1111-111111111112', 'product_view', '/product/11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111'),
('f1111111-1111-1111-1111-111111111113', 'add_to_cart', '/product/11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111')
ON CONFLICT DO NOTHING;
