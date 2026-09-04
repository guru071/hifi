# HIFI Architecture Overview

HIFI is a premium Next.js custom t-shirt commerce platform utilizing the App Router and Turbopack.

## Tech Stack
- **Frontend Framework**: Next.js 16.3 (App Router)
- **Styling**: Vanilla CSS Modules with a "Liquid Glass" design aesthetic (backdrop-filter, blur, gradients). No Tailwind.
- **Backend Infrastructure**: Supabase (PostgreSQL, Auth, Storage)
- **Database ORM**: Raw SQL Migrations + `@supabase/supabase-js` client
- **Payments**: Razorpay Node SDK & Frontend Script
- **External Integrations**: Meta/WhatsApp API for design submissions

## Core Principles
- **No Mock Logic**: Every feature has real business logic and backend database operations.
- **Single Source of Truth**: Pricing, order statuses, and inventory are strictly calculated server-side. The frontend is merely a presentation layer.
- **Security-First**: Endpoints are gated by Supabase JWTs. Stored Procedures handle concurrent DB operations safely.

## Directory Structure
- `src/app/api`: All serverless route handlers (Orders, Analytics, Reviews, Products, Webhooks)
- `src/app/admin`: Admin dashboard and management views.
- `src/components`: Reusable UI elements strictly adhering to the HIFI design system.
- `supabase/migrations`: Authoritative sequential SQL migrations defining the app schema.
