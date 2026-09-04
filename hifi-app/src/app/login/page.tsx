"use client";

import Link from "next/link";
import styles from "@/styles/auth.module.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import OAuthButtons from "@/components/ui/OAuthButtons";
import { useAuth } from "@/context/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, useEffect } from "react";

function LoginForm() {
  const { signIn } = useAuth();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const { error: signInError } = await signIn(email, password);
    setSubmitting(false);
    if (signInError) {
      setError(signInError);
      return;
    }
    const next = searchParams.get("next");
    const dest = next && next.startsWith("/") ? next : "/";
    window.location.href = dest;
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.formGroup}>
        <label htmlFor="email" className={styles.label}>Email Address</label>
        <input
          type="email"
          id="email"
          className={styles.input}
          placeholder="Enter your email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div className={styles.formGroup}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <label htmlFor="password" className={styles.label} style={{ margin: 0 }}>Password</label>
          <Link href="/forgot-password" style={{ fontSize: "0.875rem", color: "var(--accent)", textDecoration: "none" }}>Forgot password?</Link>
        </div>
        <input
          type="password"
          id="password"
          className={styles.input}
          placeholder="Enter your password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <button type="submit" className={styles.submitBtn} disabled={submitting}>
        {submitting ? "Signing in..." : "Sign In"}
      </button>
    </form>
  );
}

function LoginContent() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.replace("/");
    }
  }, [user, router]);

  return (
    <div className={`${styles.authCard} glass-panel`}>
      <div className={styles.header}>
        <h1 className={styles.title}>Welcome Back</h1>
        <p className={styles.subtitle}>Sign in to your HIFI account</p>
      </div>
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>

      <OAuthButtons />

      <div className={styles.footer}>
        Don&apos;t have an account? <Link href="/register" className={styles.link}>Create one</Link>
      </div>
    </div>
  );
}

export default function Login() {
  return (
    <>
      <Navbar />
      <main className={styles.main}>
        <LoginContent />
      </main>
      <Footer />
    </>
  );
}
