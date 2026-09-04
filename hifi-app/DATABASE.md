# HIFI Database Architecture

The authoritative database for HIFI is PostgreSQL, managed via Supabase. Schema changes are strictly enforced through sequential migrations in `supabase/migrations`.

## Core Entities

### Users (`users`)
- Firebase/Supabase Auth mapping. Stores profiles and roles (`admin`, `customer`).

### Products & Inventory (`products`, `product_variants`)
- **`products`**: Stores base metadata, active status, base price, and `delivery_settings` (for calculating global vs per-product fees).
- **`product_variants`**: Stores attributes (size, color) and `inventory_count`. Modified only via `decrement_inventory` RPC to prevent race conditions.

### Orders (`orders`, `order_items`)
- **`orders`**: Stores the absolute state of a transaction. Includes calculated `total_amount`, `shipping_fee`, `status` (pending_payment, paid, delivered), and `payment_id`.
- **`order_items`**: Maps the purchased items directly to variants, snapshotting the `unit_price` at the time of purchase.

### Reviews (`product_reviews`)
- Validated via `order_id` to guarantee only authentic purchasers can submit a review.

### Custom Designs (`custom_designs`)
- Links to WhatsApp Meta webhooks for customized uploads. Includes `design_reference` and `media_url`.

### Analytics (`analytics_events`)
- Tracks events like `add_to_cart`, `page_view` for generating real internal dashboard graphs.
