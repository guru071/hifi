---
name: security_auth
description: Authentication, authorization, RLS, and security patterns for HIFI using Firebase Auth and Supabase.
---

# Security & Auth Skill

## 1. Authentication Authority
- Firebase Authentication is the ONLY auth authority.
- Supported methods: email/password, Google, Apple, phone.
- Never create a second independent password system.

## 2. API Route Protection
Every protected API route must:
```typescript
const authHeader = request.headers.get('Authorization');
if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
const token = authHeader.replace('Bearer ', '');
const { data: { user }, error } = await supabase.auth.getUser(token);
if (error || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
```

## 3. Admin Authorization
- Never protect admin routes using UI visibility alone.
- Every admin API must validate role server-side:
  ```typescript
  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  ```

## 4. Never Trust the Client
- Client-submitted prices → recalculate server-side.
- Client-submitted roles → verify from database.
- Client-submitted payment status → verify with Razorpay API.
- Client-submitted order ownership → verify user_id match in DB.

## 5. Private File Storage
- Custom design files must be in a PRIVATE Supabase storage bucket.
- Never expose unrestricted public URLs for user-uploaded designs.
- Use `createSignedUrl()` with short expiry for admin viewing:
  ```typescript
  const { data } = await supabase.storage.from('designs').createSignedUrl(filePath, 3600);
  ```

## 6. Webhook Security
- Razorpay: Verify HMAC SHA256 signature.
- WhatsApp: Verify webhook token matches `WHATSAPP_VERIFY_TOKEN`.
- Never process unverified webhook payloads.

## 7. Secrets Management
Never put secrets in: frontend code, Git, public files, source-controlled .env files.
Use `.env.local` (gitignored) for local dev. Use environment variables in production.
