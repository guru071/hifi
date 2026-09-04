---
name: supabase_types
description: How to manually author Supabase Database types when gen types fails, and how to debug 'never' type errors.
---

# Supabase Type Safety Skill

## 1. Never Hallucinate Schema
- If `npx supabase gen types` fails (e.g., Docker issues), you MUST read the actual SQL in `supabase/migrations/*.sql` before writing types.
- Cross-reference every column name, type, and nullable constraint against the migration files.
- Do NOT guess table names. If SQL says `product_reviews`, the type must be `product_reviews`, not `reviews`.

## 2. Diagnosing 'never' Type Errors
When you see:
```
Argument of type '{ ... }' is not assignable to parameter of type 'never'
```
This means the `Database` generic is structurally broken. The Supabase client cannot resolve the table.

Common causes:
- Table name mismatch between TS type and actual SQL table.
- Missing mandatory structural fields in the `Database` interface.

## 3. Mandatory Type Structure
Every manual `Database` type MUST include:

```typescript
export interface Database {
  public: {
    Tables: {
      my_table: {
        Row: { /* ... */ }
        Insert: { /* ... */ }
        Update: { /* ... */ }
        Relationships: any[]  // ← REQUIRED on every table
      }
    }
    Views: { [_ in never]: never }       // ← REQUIRED even if empty
    Functions: {
      // Either empty: [_ in never]: never
      // Or actual RPCs:
      decrement_inventory: {
        Args: { variant_id: string; quantity: number }
        Returns: undefined
      }
    }
    Enums: { [_ in never]: never }        // ← REQUIRED even if empty
    CompositeTypes: { [_ in never]: never } // ← REQUIRED even if empty
  }
}
```

## 4. Typed Client Usage
```typescript
import { Database } from '@/types/supabase';
export const createServerClient = () => {
  return createClient<Database>(supabaseUrl, supabaseServiceKey);
};
```

## 5. After Any Schema Change
1. Update `supabase/migrations/` with a new migration file.
2. Update `src/types/supabase.ts` to match exactly.
3. Run `npm run build` to verify zero type errors.
