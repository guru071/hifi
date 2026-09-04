---
name: feature_lifecycle
description: Complete feature implementation lifecycle - from discovery to documentation. No half-finished features.
---

# Feature Lifecycle Skill

## 1. Every Feature Must Pass
```
DISCOVER → UNDERSTAND → DESIGN → IMPACT ANALYSIS →
IMPLEMENT → INTEGRATE → TEST → VERIFY → DOCUMENT
```
Never: `DISCOVER → WRITE ONE COMPONENT → STOP`

## 2. Feature Completeness Checklist
For every feature, ALL of these must be done:
- [ ] UI component(s)
- [ ] Frontend state management
- [ ] Business logic
- [ ] Backend API route(s)
- [ ] Database schema (migration if needed)
- [ ] Input validation (client + server)
- [ ] Authorization checks
- [ ] Error handling + loading states
- [ ] Success + failure states
- [ ] Tests
- [ ] Documentation update

## 3. Adding a Feature (Example: Wishlist)
1. Understand existing product/customer architecture.
2. Design schema: `wishlists` table with user_id, product_id.
3. Create migration.
4. Update `src/types/supabase.ts`.
5. Create API routes (GET, POST, DELETE).
6. Add authorization.
7. Build UI components (heart icon, wishlist page).
8. Update product cards to show wishlist state.
9. Add analytics event.
10. Add tests.
11. Run build.
12. Browser test.
13. Update documentation.

Do NOT create only a heart icon and call it done.

## 4. Modifying a Feature
1. Trace ALL files that reference the feature.
2. Update every reference consistently.
3. Run project-wide search for old names/routes/fields.
4. Verify no stale references remain.

## 5. Removing a Feature
Remove: UI, routes, imports, types, API, services, tests, documentation, unused DB objects.
Run global search afterward. No dead code.
