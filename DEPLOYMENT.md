# HIFI Deployment

## Local Development
To run HIFI locally, ensure Docker is running for the Supabase backend.

```bash
# Start local Supabase instance
npx supabase start

# Apply Database Migrations (Sequentially)
npx supabase db reset

# Start Next.js Turbopack dev server
npm run dev
```

## Environment Variables
Create a `.env.local` file at the root:

```env
# Supabase Local
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Razorpay Test Keys
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_YOUR_KEY
RAZORPAY_KEY_SECRET=YOUR_SECRET
```

## Production Build
HIFI enforces strict type checking and UI optimization via Turbopack.
```bash
npm run build
```
