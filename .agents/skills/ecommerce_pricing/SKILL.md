---
name: ecommerce_pricing
description: Rules for handling product pricing, price snapshots, delivery fees, and cart calculations in HIFI e-commerce.
---

# E-Commerce Pricing Skill

## 1. Price Source of Truth
- Product prices live in the DATABASE only. Never trust client-submitted prices.
- `base_price` is on the `products` table. `price_adjustment` is on `product_variants`.
- Final unit price = `base_price + price_adjustment`.

## 2. Price Snapshots in Orders
- When an order is created, snapshot the price at that moment into `order_items.unit_price`.
- NEVER recalculate old order totals using current product prices.
- Invoices must use the snapshotted `unit_price`, not current prices.

## 3. Server-Side Price Calculation
- The backend MUST independently fetch prices from the database during checkout.
- Never accept `totalAmount` from the frontend. Calculate it server-side:
  ```typescript
  const variant = await supabase.from('product_variants').select('*, products(base_price)').eq('id', variantId).single();
  const unitPrice = variant.products.base_price + (variant.price_adjustment || 0);
  ```

## 4. Delivery Fee Handling
- Delivery fee mode (GLOBAL vs PER_PRODUCT) is stored in `delivery_settings`.
- In GLOBAL mode: one fee applies to the entire order.
- In PER_PRODUCT mode: each product's `delivery_fee` column is used.
- The order must snapshot the final delivery fee into `orders.shipping_fee`.

## 5. Cart Calculation
- Cart totals are computed client-side for display ONLY.
- Final authoritative total is always computed server-side at checkout.
- Razorpay order amount must match the server-calculated total exactly.
