import type { DecodedIdToken } from 'firebase-admin/auth';

let _adminAuth: import('firebase-admin/auth').Auth | null = null;

/**
 * Lazily initializes Firebase Admin SDK only at runtime (not at build time).
 * This prevents Next.js build failures when env vars are not yet set.
 */
function getAdminAuth(): import('firebase-admin/auth').Auth {
  if (_adminAuth) return _adminAuth;

  // Dynamic require to avoid build-time initialization
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const admin = require('firebase-admin') as typeof import('firebase-admin');

  if (!admin.apps.length) {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !privateKey || privateKey === 'YOUR_PRIVATE_KEY') {
      throw new Error('Firebase Admin SDK is not configured. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY environment variables.');
    }

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey,
      }),
    });
  }

  _adminAuth = admin.auth();
  return _adminAuth;
}

/**
 * Verify a Firebase ID token from a request's Authorization header.
 * Returns the decoded token (with uid, email, name) or null if invalid/unconfigured.
 */
export async function verifyFirebaseToken(request: Request): Promise<DecodedIdToken | null> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);
  try {
    const auth = getAdminAuth();
    return await auth.verifyIdToken(token);
  } catch {
    return null;
  }
}
