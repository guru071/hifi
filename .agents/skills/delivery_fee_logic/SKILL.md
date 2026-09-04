---
name: delivery_fee_logic
description: Delivery fee configuration modes (GLOBAL vs PER_PRODUCT) and how they propagate through the system.
---

# Delivery Fee Logic Skill

## 1. Supported Modes
- **GLOBAL**: One delivery fee applies to all orders. Stored in `delivery_settings`.
- **PER_PRODUCT**: Each product has its own `delivery_fee` column.

## 2. Configuration Storage
```sql
-- delivery_settings table
setting_key: 'delivery_mode'    → setting_value: '"global"' or '"per_product"'
setting_key: 'global_fee'       → setting_value: '50'
```

## 3. Calculation Logic
```typescript
if (mode === 'global') {
  shippingFee = globalFee;
} else {
  shippingFee = Math.max(...items.map(i => i.product.delivery_fee || 0));
}
```

## 4. Impact Chain
When delivery fee logic changes, you MUST update ALL of these:
- `delivery_settings` table / admin UI
- Product editor (show/hide per-product fee input)
- Cart calculation (client-side display)
- Checkout calculation (server-side)
- Order creation (snapshot into `orders.shipping_fee`)
- Invoice generation
- Admin dashboard analytics
- API validation
- Tests

## 5. Snapshot Rule
The final delivery fee is snapshotted into `orders.shipping_fee` at checkout time.
Never recalculate old order shipping from current settings.
