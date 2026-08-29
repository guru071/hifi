# HIFI Feature Masterlist

## Active Features
1. **Dynamic Shopping Cart**: Stateful cart mapped to local browser, transitioning securely to server checkout.
2. **Razorpay Checkout**: Backend-calculated orders processed through Razorpay's cryptographically secure gateway.
3. **Admin CRM Dashboard**: Protected (`role='admin'`) portal analyzing sales, inventory, custom design queue, and live telemetry events.
4. **Analytics Telemetry**: `useAnalytics` provider tracks user `page_view` and `add_to_cart` events directly to the DB.
5. **Authentic Reviews**: Reviews require mathematical proof of purchase via `order_items`. Averages displayed are 100% genuine database aggregations.
6. **Invoicing**: Snapshot-based invoice UI, pulling historical `base_price` and `delivery_settings` decoupled from active live pricing changes.
7. **Concurrency Inventory**: Checkouts use a PostgreSQL stored procedure (`decrement_inventory`) to atomize inventory deduction and eliminate race conditions.
8. **WhatsApp Design Flow**: Meta webhook interception binding uploaded custom design files securely to unique user sessions.
