---
name: order_management
description: Order lifecycle management - creation, status transitions, price snapshots, inventory deduction.
---

# Order Management Skill

## 1. Order Fields
Every order must contain:
- `id`, `user_id`, `status`, `total_amount`, `shipping_fee`
- `shipping_address` (JSON snapshot), `payment_id`
- `created_at`, `updated_at`

## 2. Order Items
Each `order_item` must snapshot:
- `product_variant_id`, `custom_design_id` (nullable)
- `quantity`, `unit_price` (snapshotted at time of order)

## 3. Status Lifecycle
```
pending → paid → processing → shipped → delivered
                                      → cancelled
```
Status transitions are server-controlled. Never allow client to set arbitrary status.

## 4. Checkout Flow
1. Validate all items exist and are active.
2. Fetch current prices from database (never trust client prices).
3. Calculate subtotal server-side.
4. Fetch delivery fee from settings.
5. Create Razorpay order with server-calculated total.
6. Atomically decrement inventory using RPC:
   ```typescript
   await supabase.rpc('decrement_inventory', { variant_id: id, quantity: qty });
   ```
7. Insert order + order_items.
8. Return Razorpay order ID to client.

## 5. Inventory Deduction
- Use atomic database function `decrement_inventory` to prevent race conditions.
- Never do `SELECT count → UPDATE count - 1` (not atomic).
- Check for negative inventory and reject if insufficient.

## 6. Historical Data
- Never derive old order totals from today's product prices.
- Invoice must match the paid order snapshot exactly.
