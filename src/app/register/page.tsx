"use client";

import Link from "next/link";
import styles from "@/styles/auth.module.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import OAuthButtons from "@/components/ui/OAuthButtons";
import { useAuth } from "@/context/AuthContext";
import { validateEmail } from "@/lib/email-validation";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function Register() {
  const { signUp, user } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const emailError = validateEmail(email);
    if (emailError) {
      setError(emailError);
      return;
    }
    if (!phone.trim()) {
      setError("A phone number is required.");
      return;
    }
    if (!/^[+\d][\d\s()-]{6,19}$/.test(phone.trim())) {
      setError("Please enter a valid phone number.");
      return;
    }

    setSubmitting(true);
    const { error: signUpError } = await signUp(email, password, name, phone.trim());
    setSubmitting(false);
    if (signUpError) {
      setError(signUpError);
      return;
    }
    router.push("/profile");
    router.refresh();
  }

  useEffect(() => {
    if (user) {
      router.replace("/");
    }
  }, [user, router]);

  return (
    <>
      <Navbar />
      <main className={styles.main}>
        <div className={`${styles.authCard} glass-panel`}>
          <div className={styles.header}>
            <h1 className={styles.title}>Create Account</h1>
            <p className={styles.subtitle}>Join HIFI to start customizing</p>
          </div>

          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label htmlFor="name" className={styles.label}>Full Name</label>
              <input
                type="text"
                id="name"
                className={styles.input}
                placeholder="Enter your full name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

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
              <label htmlFor="phone" className={styles.label}>Phone Number</label>
              <input
                type="tel"
                id="phone"
                className={styles.input}
                placeholder="+91 98123 45678"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="password" className={styles.label}>Password</label>
              <input
                type="password"
                id="password"
                className={styles.input}
                placeholder="Create a password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error && <p className={styles.error}>{error}</p>}

            <button type="submit" className={styles.submitBtn} disabled={submitting}>
              {submitting ? "Creating..." : "Create Account"}
            </button>
          </form>

          <OAuthButtons />
          
          <div className={styles.footer}>
            Already have an account? <Link href="/login" className={styles.link}>Sign in</Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
