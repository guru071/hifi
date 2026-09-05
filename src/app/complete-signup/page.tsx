"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import styles from "@/styles/auth.module.css";
import { useAuth } from "@/context/AuthContext";

function CompleteSignupForm() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) router.replace("/login");
  }, [user, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = phone.trim();
    if (!trimmed) {
      setError("A phone number is required.");
      return;
    }
    if (!/^[+\d][\d\s()-]{6,19}$/.test(trimmed)) {
      setError("Please enter a valid phone number.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const token = user ? await user.getIdToken() : null;
      const res = await fetch("/api/profile/phone", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ phone: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save phone");
      const next = searchParams.get("next");
      router.push(next && next.startsWith("/") ? next : "/profile");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <p className={styles.subtitle}>
        One more step — confirm your number for {user?.email ?? "your account"}.
        We use it for order updates and delivery.
      </p>

      <div className={styles.formGroup}>
        <label htmlFor="phone" className={styles.label}>Phone Number</label>
        <input
          type="tel"
          id="phone"
          className={styles.input}
          placeholder="+91 98123 45678"
          required
          autoFocus
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <button type="submit" className={styles.submitBtn} disabled={submitting}>
        {submitting ? "Saving..." : "Continue"}
      </button>
    </form>
  );
}

export default function CompleteSignup() {
  return (
    <>
      <Navbar />
      <main className={styles.main}>
        <div className={`${styles.authCard} glass-panel`}>
          <div className={styles.header}>
            <h1 className={styles.title}>Complete your signup</h1>
          </div>
          <Suspense fallback={null}>
            <CompleteSignupForm />
          </Suspense>
        </div>
      </main>
      <Footer />
    </>
  );
}
