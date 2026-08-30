"use client";

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  OAuthProvider as FirebaseOAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  sendEmailVerification,
  verifyBeforeUpdateEmail,
  type User,
} from "firebase/auth";
import { firebaseAuth } from "@/lib/firebase/client";

export type OAuthProvider = "google" | "apple";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  getIdToken: () => Promise<string | null>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, fullName: string, phone?: string) => Promise<{ error: string | null }>;
  signInWithProvider: (provider: OAuthProvider) => Promise<{ error: string | null }>;
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
  signInWithProvider: async () => ({ error: null }),
  sendPasswordReset: async () => ({ error: null }),
  verifyEmail: async () => ({ error: null }),
  updateUserEmail: async () => ({ error: null }),
  signOut: async () => {},
});

// Sync the Firebase user into our Supabase users table
async function syncProfile(user: User) {
  try {
    const token = await user.getIdToken();
    await fetch("/api/auth/sync", {
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
  } catch {
    // Non-fatal: profile sync failure shouldn't block login
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
    } catch (e: unknown) {
      const msg = (e as { message?: string })?.message ?? "Sign in failed";
      return { error: friendlyError(msg) };
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string, fullName: string, phone?: string) => {
    try {
      const { user: newUser } = await createUserWithEmailAndPassword(firebaseAuth, email, password);
      await updateProfile(newUser, { displayName: fullName });
      // Sync with phone number
      const token = await newUser.getIdToken();
      await fetch("/api/auth/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ email, full_name: fullName, phone: phone ?? null }),
      });
      return { error: null };
    } catch (e: unknown) {
      const msg = (e as { message?: string })?.message ?? "Sign up failed";
      return { error: friendlyError(msg) };
    }
  }, []);

  const signInWithProvider = useCallback(async (provider: OAuthProvider) => {
    try {
      if (provider === "google") {
        const googleProvider = new GoogleAuthProvider();
        await signInWithPopup(firebaseAuth, googleProvider);
      } else if (provider === "apple") {
        const appleProvider = new FirebaseOAuthProvider("apple.com");
        appleProvider.addScope("email");
        appleProvider.addScope("name");
        await signInWithPopup(firebaseAuth, appleProvider);
      }
      return { error: null };
    } catch (e: unknown) {
      const msg = (e as { message?: string })?.message ?? "OAuth sign in failed";
      if (msg.includes("popup-closed-by-user") || msg.includes("cancelled-popup-request")) {
        return { error: null }; // User just closed the popup — not an error
      }
      return { error: friendlyError(msg) };
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
    } catch (e: unknown) {
      const msg = (e as { message?: string })?.message ?? "Password reset failed";
      return { error: friendlyError(msg) };
    }
  }, []);

  const verifyEmail = useCallback(async () => {
    if (!firebaseAuth.currentUser) return { error: "No authenticated user" };
    try {
      await sendEmailVerification(firebaseAuth.currentUser);
      return { error: null };
    } catch (e: unknown) {
      const msg = (e as { message?: string })?.message ?? "Email verification failed";
      return { error: friendlyError(msg) };
    }
  }, []);

  const updateUserEmail = useCallback(async (newEmail: string) => {
    if (!firebaseAuth.currentUser) return { error: "No authenticated user" };
    try {
      await verifyBeforeUpdateEmail(firebaseAuth.currentUser, newEmail);
      return { error: null };
    } catch (e: unknown) {
      const msg = (e as { message?: string })?.message ?? "Email update failed";
      return { error: friendlyError(msg) };
    }
  }, []);

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      getIdToken, 
      signIn, 
      signUp, 
      signInWithProvider, 
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

function friendlyError(msg: string): string {
  if (msg.includes("user-not-found") || msg.includes("wrong-password") || msg.includes("invalid-credential")) {
    return "Invalid email or password.";
  }
  if (msg.includes("email-already-in-use")) return "An account with this email already exists.";
  if (msg.includes("weak-password")) return "Password must be at least 6 characters.";
  if (msg.includes("invalid-email")) return "Invalid email address.";
  if (msg.includes("too-many-requests")) return "Too many attempts. Please try again later.";
  if (msg.includes("network-request-failed")) return "Network error. Check your connection.";
  return msg;
}
