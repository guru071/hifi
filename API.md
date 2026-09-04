# HIFI API Contracts

All endpoints live in `src/app/api` and use Next.js App Router route handlers.

## 1. `POST /api/orders`
- **Purpose**: Creates an order, decrements variant inventory (via RPC), and generates a Razorpay Order ID.
- **Request Body**: `{ userId?: string, shippingAddress: string, items: Array<{ variantId: string, quantity: number }> }`
- **Response**: `{ success: true, orderId: string, razorpayOrderId: string, amount: number, currency: "USD" }`
- **Fails**: `409 Conflict` if inventory is insufficient (caught via RPC rollback).

## 2. `POST /api/reviews`
- **Purpose**: Submits a product review.
- **Security**: Expects Bearer token. Verifies `user_id` purchased `product_id` via `order_items` join.
- **Request Body**: `{ product_id: string, order_id: string, rating: number, comment: string }`

## 3. `GET /api/analytics`
- **Purpose**: Aggregates `page_view` and `add_to_cart` events.
- **Response**: Real metric counts extracted from `analytics_events`.

## 4. `POST /api/webhooks/whatsapp`
- **Purpose**: Receives Meta webhook payloads when a user uploads a custom design image.
- **Implementation**: Extracts media URL and securely saves to Supabase storage.

## 5. `POST /api/payments/verify`
- **Purpose**: Cryptographically verifies Razorpay frontend success callbacks.
- **Request Body**: `{ razorpay_payment_id, razorpay_order_id, razorpay_signature, orderId }`
- **Verification**: `crypto.createHmac` against `RAZORPAY_KEY_SECRET`. Marks order as `paid`.
