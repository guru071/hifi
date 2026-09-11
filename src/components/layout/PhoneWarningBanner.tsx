"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import styles from "@/styles/layout.module.css";
import { useRouter, usePathname } from "next/navigation";

export default function PhoneWarningBanner() {
  const { user, getIdToken } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [profilePhone, setProfilePhone] = useState<string | null>("loading");
  const [inputPhone, setInputPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setProfilePhone(null);
      return;
    }

    async function checkProfile() {
      try {
        const token = await getIdToken();
        const res = await fetch("/api/profile", {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        setProfilePhone(data.profile?.phone || null);
      } catch (err) {
        setProfilePhone(null);
      }
    }
    checkProfile();
  }, [user, getIdToken]);

    // Don't show if they aren't logged in, or we are still checking, or they already have a phone number
  // ALSO don't show on admin pages
  if (!user || profilePhone === "loading" || profilePhone || pathname.startsWith('/admin')) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputPhone.trim()) {
      setError("Please enter a valid phone number.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const token = await getIdToken();
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ phone: inputPhone.trim() })
      });
      if (!res.ok) {
        throw new Error("Failed to update phone number");
      }
      setProfilePhone(inputPhone.trim());
      // Refresh current page if on checkout to clear any blocks
      if (pathname === '/checkout') {
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.warningBanner}>
      <div className={styles.warningContent}>
        <p><strong>Action Required:</strong> Please set up your mobile number to purchase products and receive updates.</p>
        <form onSubmit={handleSubmit} className={styles.warningForm}>
          <input 
            type="tel" 
            placeholder="Enter Phone Number" 
            value={inputPhone} 
            onChange={(e) => setInputPhone(e.target.value)}
            className={styles.warningInput}
            required
          />
          <button type="submit" disabled={submitting} className={styles.warningBtn}>
            {submitting ? "Saving..." : "Save"}
          </button>
        </form>
        {error && <span style={{ color: "red", fontSize: "0.8rem", marginLeft: "10px" }}>{error}</span>}
      </div>
    </div>
  );
}
