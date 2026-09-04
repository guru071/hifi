# HIFI Payments System

As per Master Rule 24, HIFI integrates with Razorpay for secure checkout.

## Checkout Flow
1. **Cart Submission**: Frontend sends raw cart data to `/api/orders`.
2. **Server Price Calculation**: The server discards frontend prices and recalculates the total from the database (`base_price` + `delivery_fee`).
3. **Inventory Lock**: The server calls the `decrement_inventory` RPC. If stock is available, it deducts it and locks the transaction. If out of stock, it aborts.
4. **Gateway Initialization**: The server calls the Razorpay SDK to create a secure `razorpay_order_id` for the exact calculated amount in USD/INR.
5. **UI Popup**: The frontend injects `checkout.razorpay.com/v1/checkout.js` and opens the gateway binding to the `order_id`.
6. **Signature Verification**: Upon user completion, the popup calls the `handler` function which hits `/api/payments/verify`. The server uses `crypto.createHmac` with `RAZORPAY_KEY_SECRET` to cryptographically verify the signature, ensuring no client spoofing.
7. **Order Finalization**: The server marks the order `paid` and attaches the `payment_reference`.
