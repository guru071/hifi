"use client";

import { useState } from "react";
import { useAuth, type OAuthProvider } from "@/context/AuthContext";
import styles from "./OAuthButtons.module.css";

/**
 * Google + Apple sign-in via Firebase popup (no page redirect needed).
 */
export default function OAuthButtons() {
  const { signInWithProvider } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<OAuthProvider | null>(null);

  async function handleProvider(provider: OAuthProvider) {
    setBusy(provider);
    setError(null);
    const { error: oauthError } = await signInWithProvider(provider);
    setBusy(null);
    if (oauthError) setError(oauthError);
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.divider}>
        <span>or continue with</span>
      </div>
      {error && <p className={styles.error}>{error}</p>}
      <div className={styles.row}>
        <button
          type="button"
          className={styles.providerBtn}
          onClick={() => handleProvider("google")}
          disabled={busy !== null}
        >
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18A11 11 0 001 12c0 1.77.43 3.45 1.18 4.94l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>
          <span>{busy === "google" ? "Connecting..." : "Google"}</span>
        </button>

        <button
          type="button"
          className={styles.providerBtn}
          onClick={() => handleProvider("apple")}
          disabled={busy !== null}
        >
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="currentColor">
            <path d="M17.05 12.54c-.03-2.53 2.06-3.74 2.16-3.8-1.18-1.72-3.01-1.96-3.66-1.99-1.56-.16-3.04.92-3.83.92-.79 0-2-.9-3.3-.87-1.7.03-3.26.99-4.13 2.51-1.77 3.06-.45 7.6 1.27 10.09.84 1.22 1.84 2.6 3.16 2.55 1.27-.05 1.75-.82 3.28-.82s1.96.82 3.3.8c1.37-.03 2.24-1.25 3.07-2.48.97-1.42 1.37-2.8 1.39-2.87-.03-.01-2.67-1.02-2.7-4.05zM14.4 4.08c.7-.85 1.17-2.02 1.04-3.2-1.01.04-2.23.67-2.96 1.52-.65.75-1.22 1.95-1.07 3.1 1.13.09 2.29-.57 2.99-1.42z" />
          </svg>
          <span>{busy === "apple" ? "Connecting..." : "Apple"}</span>
        </button>
      </div>
    </div>
  );
}
