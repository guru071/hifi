import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  sendEmailVerification,
  verifyBeforeUpdateEmail,
  type User,
} from "firebase/auth";
import { firebaseAuth } from "../lib/firebase/client";
import { GoogleSignin } from '@react-native-google-signin/google-signin';

// Configure Google Signin
GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || 'dummy-web-client-id.apps.googleusercontent.com',
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || 'dummy-ios-client-id.apps.googleusercontent.com',
});

// API Base URL
const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  getIdToken: () => Promise<string | null>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, fullName: string, phone?: string) => Promise<{ error: string | null }>;
  sendPasswordReset: (email: string) => Promise<{ error: string | null }>;
  verifyEmail: () => Promise<{ error: string | null }>;
  updateUserEmail: (newEmail: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  getIdToken: async () => null,
  signIn: async () => ({ error: null }),
  signUp: async () => ({ error: null }),
  sendPasswordReset: async () => ({ error: null }),
  verifyEmail: async () => ({ error: null }),
  updateUserEmail: async () => ({ error: null }),
  signOut: async () => {},
});

// Sync the Firebase user into our Supabase users table via Next.js backend
async function syncProfile(user: User) {
  try {
    const token = await user.getIdToken();
    await fetch(`${API_URL}/api/auth/sync`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        email: user.email,
        full_name: user.displayName ?? user.email?.split("@")[0] ?? "User",
        phone: user.phoneNumber ?? null,
      }),
    });
  } catch (e) {
    console.warn("Profile sync failed", e);
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
      if (firebaseUser) {
        await syncProfile(firebaseUser);
      }
    });
    return unsubscribe;
  }, []);

  const getIdToken = useCallback(async () => {
    if (!firebaseAuth.currentUser) return null;
    return firebaseAuth.currentUser.getIdToken();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(firebaseAuth, email, password);
      return { error: null };
    } catch (e: any) {
      return { error: e.message || "Sign in failed" };
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string, fullName: string, phone?: string) => {
    try {
      const { user: newUser } = await createUserWithEmailAndPassword(firebaseAuth, email, password);
      await updateProfile(newUser, { displayName: fullName });
      const token = await newUser.getIdToken();
      await fetch(`${API_URL}/api/auth/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ email, full_name: fullName, phone: phone ?? null }),
      });
      return { error: null };
    } catch (e: any) {
      return { error: e.message || "Sign up failed" };
    }
  }, []);

  const signOut = useCallback(async () => {
    await firebaseSignOut(firebaseAuth);
    setUser(null);
  }, []);

  const sendPasswordReset = useCallback(async (email: string) => {
    try {
      await sendPasswordResetEmail(firebaseAuth, email);
      return { error: null };
    } catch (e: any) {
      return { error: e.message || "Password reset failed" };
    }
  }, []);

  const verifyEmail = useCallback(async () => {
    if (!firebaseAuth.currentUser) return { error: "No authenticated user" };
    try {
      await sendEmailVerification(firebaseAuth.currentUser);
      return { error: null };
    } catch (e: any) {
      return { error: e.message || "Email verification failed" };
    }
  }, []);

  const updateUserEmail = useCallback(async (newEmail: string) => {
    if (!firebaseAuth.currentUser) return { error: "No authenticated user" };
    try {
      await verifyBeforeUpdateEmail(firebaseAuth.currentUser, newEmail);
      return { error: null };
    } catch (e: any) {
      return { error: e.message || "Email update failed" };
    }
  }, []);

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      getIdToken, 
      signIn, 
      signUp, 
      sendPasswordReset,
      verifyEmail,
      updateUserEmail,
      signOut 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
