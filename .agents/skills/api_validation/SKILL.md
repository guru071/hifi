---
name: api_validation
description: Server-side input validation patterns for all HIFI API routes.
---

# API Validation Skill

## 1. Validate at Every Layer
- UI (client-side for UX only)
- API route (server-side, authoritative)
- Database (constraints, CHECK, NOT NULL)

## 2. Orders API Validation
```typescript
if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
  return NextResponse.json({ error: "Missing or empty items array" }, { status: 400 });
}
for (const item of body.items) {
  if (!item.productId || typeof item.quantity !== 'number' || item.quantity <= 0) {
    return NextResponse.json({ error: "Invalid item" }, { status: 400 });
  }
}
if (!body.shippingAddress || typeof body.shippingAddress !== 'object') {
  return NextResponse.json({ error: "Missing shipping address" }, { status: 400 });
}
```

## 3. Reviews API Validation
```typescript
if (!product_id || typeof product_id !== 'string') → 400
if (!order_id || typeof order_id !== 'string') → 400
if (typeof rating !== 'number' || rating < 1 || rating > 5) → 400
if (comment !== undefined && typeof comment !== 'string') → 400
```
Plus: verify user owns the order, order status is `paid` or `delivered`.

## 4. General Rules
- Never rely only on frontend validation.
- Validate types, ranges, required fields.
- Return clear error messages with 400 status.
- Never expose internal error details to clients.
- Log technical details server-side only.
