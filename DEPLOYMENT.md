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
Create a `.env` or `.env.local` file at the root. This project currently keeps
Firebase keys in `.env`; that is fine. Firebase is the customer login provider,
and Supabase stores the customer profile row linked by Firebase UID.

```env
# Supabase Local
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Firebase Web App config
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_APP_ID=...

# Firebase Admin SDK service account
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-...@your-project-id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Razorpay Test Keys
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_YOUR_KEY
RAZORPAY_KEY_SECRET=YOUR_SECRET
```

After setting the env vars, apply migrations so `public.users.auth_id` can store
Firebase UID strings:

```bash
npx supabase db push
```

## Production Build
HIFI enforces strict type checking and UI optimization via Turbopack.
```bash
npm run build
```
