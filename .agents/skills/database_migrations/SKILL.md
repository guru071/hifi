---
name: database_migrations
description: Database migration rules, ordering, and schema change propagation for Supabase.
---

# Database Migrations Skill

## 1. Migration File Naming
- Format: `NNNNN_description.sql` (e.g., `00001_initial_schema.sql`).
- Migrations are ordered and applied sequentially.
- Never modify an already-applied migration. Create a new one.

## 2. After Every Schema Change
1. Create new migration file in `supabase/migrations/`.
2. Update `src/types/supabase.ts` to match exactly.
3. Update all affected: queries, services, API routes, types, validation, tests.
4. Run `npm run build` to verify type safety.

## 3. Migration Content Rules
- Always include `IF NOT EXISTS` for safety where appropriate.
- Use proper foreign key constraints with `ON DELETE CASCADE` or `ON DELETE SET NULL`.
- Add CHECK constraints for business rules (e.g., `CHECK (rating >= 1 AND rating <= 5)`).
- Use `uuid_generate_v4()` for primary keys.
- Default timestamps with `DEFAULT NOW()`.

## 4. RLS (Row Level Security)
- Enable RLS on sensitive tables.
- Create policies for read/write based on `auth.uid()`.
- Admin operations use service role key to bypass RLS.

## 5. HIFI Migration Files
```
00001_initial_schema.sql    → users, products, variants, designs, orders, items, delivery_settings
00002_inventory_rpc.sql     → decrement_inventory function
00003_reviews_analytics.sql → product_reviews, analytics_events
00004_whatsapp_fields.sql   → WhatsApp-specific columns
00005_private_storage.sql   → private designs storage bucket
```
