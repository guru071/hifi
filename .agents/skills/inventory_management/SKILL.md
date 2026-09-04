---
name: inventory_management
description: Variant-aware inventory tracking, atomic deduction, and concurrency protection.
---

# Inventory Management Skill

## 1. Variant-Aware Inventory
Inventory is tracked per variant, not per product:
```
Product: Classic Black Tee
  - Black / S → inventory_count: 15
  - Black / M → inventory_count: 10
  - Black / L → inventory_count: 4
```

## 2. Atomic Deduction (Rule 43)
Use a database RPC function to prevent race conditions:
```sql
CREATE OR REPLACE FUNCTION decrement_inventory(p_variant_id UUID, p_quantity INT)
RETURNS VOID AS $$
BEGIN
  UPDATE product_variants
  SET inventory_count = inventory_count - p_quantity
  WHERE id = p_variant_id AND inventory_count >= p_quantity;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient inventory for variant %', p_variant_id;
  END IF;
END;
$$ LANGUAGE plpgsql;
```

## 3. Rules
- Never allow negative inventory.
- Never allow purchase of inactive variants.
- Never do `SELECT` then `UPDATE` separately (race condition).
- Protect against concurrent checkout for the same variant.
- SKU must be unique per variant.

## 4. Admin Inventory View
- Show inventory grouped by product, then by variant (color/size).
- Highlight low-stock variants (< 5 units).
- Allow bulk inventory updates.
