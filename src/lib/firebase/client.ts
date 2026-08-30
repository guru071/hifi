import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let _app: FirebaseApp | null = null;
let _auth: Auth | null = null;

function getFirebaseApp(): FirebaseApp {
  if (_app) return _app;
  _app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  return _app;
}

/**
 * Lazily initialized Firebase Auth.
 * Returns a real Auth instance at runtime, or a no-op proxy during
 * build-time static generation (when env vars are absent).
 */
function getFirebaseAuth(): Auth {
  if (_auth) return _auth;

  // During Vercel build, env vars are missing — return a safe proxy
  // that won't crash static page generation.
  if (!firebaseConfig.apiKey) {
    return new Proxy({} as Auth, {
      get(_, prop) {
        if (prop === 'currentUser') return null;
        if (prop === 'onAuthStateChanged') return (_cb: unknown) => () => {};
        return () => {};
      },
    });
  }

  _auth = getAuth(getFirebaseApp());
  return _auth;
}

export const firebaseAuth = getFirebaseAuth();
export default getFirebaseApp;

