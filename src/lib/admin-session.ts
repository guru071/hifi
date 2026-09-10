import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const SECRET_KEY = new TextEncoder().encode(
  process.env.ADMIN_SESSION_SECRET || 'FALLBACK_RANDOM_LONG_SECRET_KEY_MUST_BE_IN_ENV'
);

export interface AdminPayload {
  sub: string;
  role: 'admin';
  email: string;
}

export async function createAdminSession(email: string): Promise<string> {
  return new SignJWT({ role: 'admin', email })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('8h')
    .sign(SECRET_KEY);
}

export async function verifyAdminSessionToken(token: string): Promise<AdminPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY, {
      algorithms: ['HS256'],
    });
    return payload as unknown as AdminPayload;
  } catch {
    return null;
  }
}

export async function checkAdminAuth(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get('hifi_admin_session')?.value;
  if (!token) return false;
  const session = await verifyAdminSessionToken(token);
  return session?.role === 'admin';
}
