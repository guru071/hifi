"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "@/styles/auth.module.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export default function AdminLogin() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Invalid password");
        setSubmitting(false);
        return;
      }

      // Success
      router.push("/admin");
      router.refresh();
    } catch {
      setError("An error occurred");
      setSubmitting(false);
    }
  }

  return (
    <>
      <Navbar />
      <main className={styles.main}>
        <div className={`${styles.authCard} glass-panel`}>
          <div className={styles.header}>
            <h1 className={styles.title}>HIFI Admin</h1>
            <p className={styles.subtitle}>Enter the admin password to continue</p>
          </div>
          
          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label htmlFor="password" className={styles.label}>Admin Password</label>
              <input
                type="password"
                id="password"
                className={styles.input}
                placeholder="Enter password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error && <p className={styles.error}>{error}</p>}

            <button type="submit" className={styles.submitBtn} disabled={submitting}>
              {submitting ? "Verifying..." : "Access Dashboard"}
            </button>
          </form>
        </div>
      </main>
      <Footer />
    </>
  );
}
