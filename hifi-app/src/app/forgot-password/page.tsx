"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "@/styles/auth.module.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useAuth } from "@/context/AuthContext";

export default function ForgotPassword() {
  const { sendPasswordReset } = useAuth();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setMessage(null);

    const { error: resetError } = await sendPasswordReset(email);
    setSubmitting(false);

    if (resetError) {
      setError(resetError);
    } else {
      setMessage("If an account exists with this email, a password reset link has been sent.");
      setEmail("");
    }
  }

  return (
    <>
      <Navbar />
      <main className={styles.main}>
        <div className={`${styles.authCard} glass-panel`}>
          <div className={styles.header}>
            <h1 className={styles.title}>Reset Password</h1>
            <p className={styles.subtitle}>Enter your email to receive a reset link</p>
          </div>

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

            {error && <p className={styles.error}>{error}</p>}
            {message && <p className={styles.success} style={{ color: "var(--success)", fontSize: "0.875rem", marginBottom: "1rem" }}>{message}</p>}

            <button type="submit" className={styles.submitBtn} disabled={submitting}>
              {submitting ? "Sending..." : "Send Reset Link"}
            </button>
          </form>

          <div className={styles.footer}>
            Remembered your password? <Link href="/login" className={styles.link}>Sign In</Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
