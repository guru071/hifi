---
name: change_impact_analysis
description: How to trace the full impact of any code change across the HIFI codebase before implementing.
---

# Change Impact Analysis Skill

## 1. Before Any Non-Trivial Change
Create an internal impact map. Identify:
- Direct files being modified
- Dependent files (imports, consumers)
- Database objects affected
- API endpoints affected
- Services affected
- UI components affected
- Tests affected
- Documentation affected
- Configuration affected

## 2. Example: Changing Delivery Fee Logic
Impact map:
```
delivery_settings table      ← DB schema
delivery configuration UI    ← Admin settings page
product editor              ← Show/hide fee input
delivery calculation service ← Business logic
cart page                   ← Client-side display
checkout page               ← Client-side calculation
orders API route            ← Server-side calculation
order creation              ← Snapshot fee
invoice generation          ← Display fee
admin dashboard             ← Analytics
types/supabase.ts           ← Type definitions
tests                       ← Validation tests
API schemas                 ← Request/response types
```
ALL must be updated consistently.

## 3. Search After Changes
After modifying any feature, grep the entire repo for:
- Old function/variable names
- Old route paths
- Old field names
- Old component names
- Old database column references

```bash
grep -rn "old_field_name" src/
```

## 4. Build Verification
After every major change:
1. `npm run build` → fix all type errors
2. Run tests
3. Browser test critical flows
4. Check for console errors
