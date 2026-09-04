# Changelog

All notable changes to the HIFI project are documented here in compliance with Rule 51.

## [Unreleased]
### Added
- **Razorpay Integration**: Complete end-to-end integration with Razorpay, generating server-side orders and verifying callbacks with HMAC signatures.
- **Analytics System**: Global tracking provider for `add_to_cart` and `page_view` events, routed to a new `analytics_events` table and visualized in the Admin Dashboard.
- **Invoice UI**: Dedicated dynamic route `/profile/invoice/[id]` that accurately parses historical price snapshots.
- **Missing Documentation**: Generated 9 mandatory architectural markdown files to comply with Rule 50.

### Changed
- **Pricing Authority**: `/api/orders` now strictly recalculates all cart logic server-side by pulling base price and active `delivery_settings` (Rule 18).
- **Reviews Authentic**: `/api/reviews` now demands Bearer token auth and strictly queries `order_items` to ensure fake reviews cannot be generated.
- **Inventory Concurrency**: Introduced `00004_inventory_rpc.sql` migration to enforce atomic `FOR UPDATE` lock decrementing, halting race conditions during checkout.

### Removed
- **Dead Code**: Removed placeholder strings and dummy mocks in the WhatsApp webhook controller.
- **Fake UI**: Removed the dummy `router.push('/profile')` bypass in the `/checkout` UI that previously ignored payment gateways.

### Fixed
- **Admin Authorization**: `/api/settings` and `/api/products/[id]` are now secured via `supabase.auth.getUser()` verifying `role === 'admin'`, eliminating front-end visibility reliance.
