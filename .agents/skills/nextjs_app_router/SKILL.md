---
name: nextjs_app_router
description: Next.js App Router patterns used in HIFI - API routes, layouts, dynamic routes, client vs server components.
---

# Next.js App Router Skill

## 1. Directory Structure
```
src/app/
  layout.tsx          → Root layout (global styles, fonts, providers)
  page.tsx            → Home page
  globals.css         → Global styles
  shop/page.tsx       → Shop page
  product/[id]/page.tsx → Dynamic product page
  cart/page.tsx       → Cart page
  checkout/page.tsx   → Checkout page
  profile/page.tsx    → User profile
  admin/              → Admin section (layout.tsx + sub-pages)
  api/                → API routes
    products/route.ts
    orders/route.ts
    reviews/route.ts
    webhooks/whatsapp/route.ts
```

## 2. API Route Pattern
```typescript
import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET(request: Request) { /* ... */ }
export async function POST(request: Request) { /* ... */ }
```

## 3. Client vs Server Components
- Pages default to server components.
- Use `'use client'` directive only when needed (hooks, browser APIs, interactivity).
- Keep data fetching in server components when possible.

## 4. Dynamic Routes
- `[id]` in folder name → `params.id` in component.
- Use `generateStaticParams` for static generation where appropriate.

## 5. CSS Modules
- Each page/component has its own `.module.css` file.
- Import as: `import styles from './page.module.css'`.
- Use `styles.className` in JSX.
