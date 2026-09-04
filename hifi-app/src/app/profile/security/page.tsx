"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import styles from "../page.module.css";
import { useAuth } from "@/context/AuthContext";

export default function SecuritySettings() {
  const { user, verifyEmail, updateUserEmail, sendPasswordReset } = useAuth();
  const router = useRouter();

  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!user) {
    // If not logged in, it will redirect soon, but render nothing for now.
    return null;
  }

  const handleVerifyEmail = async () => {
    setIsSubmitting(true);
    setMessage(null);
    const { error } = await verifyEmail();
    setIsSubmitting(false);
    if (error) {
      setMessage({ type: "error", text: error });
    } else {
      setMessage({ type: "success", text: "Verification email sent. Please check your inbox." });
    }
  };

  const handleChangeEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || newEmail === user.email) return;
    
    setIsSubmitting(true);
    setMessage(null);
    const { error } = await updateUserEmail(newEmail);
    setIsSubmitting(false);
    
    if (error) {
      setMessage({ type: "error", text: error });
    } else {
      setMessage({ type: "success", text: `Confirmation sent to ${newEmail}. Please click the link in that email to confirm the change.` });
      setIsEditingEmail(false);
      setNewEmail("");
    }
  };

  const handleResetPassword = async () => {
    if (!user.email) return;
    setIsSubmitting(true);
    setMessage(null);
    const { error } = await sendPasswordReset(user.email);
    setIsSubmitting(false);
    if (error) {
      setMessage({ type: "error", text: error });
    } else {
      setMessage({ type: "success", text: "Password reset link sent to your email." });
    }
  };

  return (
    <>
      <Navbar />
      <main className={styles.main}>
        <div className={styles.header}>
          <button className={styles.backBtn} onClick={() => router.push("/profile")}>
            <span className="material-symbols-outlined">arrow_back</span>
            Back to Profile
          </button>
          <h1 className={styles.title}>Security & Sign-in</h1>
          <p className={styles.subtitle}>Manage your email, password, and security settings.</p>
        </div>

        <div className={styles.contentGrid}>
          <div className={styles.ordersArea} style={{ gridColumn: "1 / -1", maxWidth: "800px", margin: "0 auto" }}>
            
            {message && (
              <div style={{
                padding: "1rem",
                borderRadius: "8px",
                marginBottom: "2rem",
                backgroundColor: message.type === 'error' ? "rgba(255,50,50,0.1)" : "rgba(50,255,50,0.1)",
                color: message.type === 'error' ? "var(--error)" : "var(--success)",
                border: `1px solid ${message.type === 'error' ? "rgba(255,50,50,0.3)" : "rgba(50,255,50,0.3)"}`
              }}>
                {message.text}
              </div>
            )}

            <div className={`glass-panel ${styles.orderCard}`} style={{ marginBottom: "2rem" }}>
              <div className={styles.orderHeader}>
                <h2 style={{ fontSize: "1.25rem", margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span className="material-symbols-outlined">mail</span>
                  Email Address
                </h2>
              </div>
              <div className={styles.orderBody} style={{ padding: "1.5rem" }}>
                {!isEditingEmail ? (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
                    <div>
                      <p style={{ margin: "0 0 0.5rem 0", fontSize: "1.1rem" }}>{user.email}</p>
                      {user.emailVerified ? (
                        <span style={{ color: "var(--success)", fontSize: "0.875rem", display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                          <span className="material-symbols-outlined" style={{ fontSize: "1rem" }}>verified</span>
                          Verified
                        </span>
                      ) : (
                        <span style={{ color: "var(--warning)", fontSize: "0.875rem", display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                          <span className="material-symbols-outlined" style={{ fontSize: "1rem" }}>warning</span>
                          Unverified
                        </span>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: "1rem" }}>
                      {!user.emailVerified && (
                        <button 
                          className={styles.actionBtn} 
                          onClick={handleVerifyEmail}
                          disabled={isSubmitting}
                          style={{ padding: "0.5rem 1rem", minHeight: "auto", fontSize: "0.875rem" }}
                        >
                          Send Verification
                        </button>
                      )}
                      <button 
                        className={styles.actionBtn} 
                        onClick={() => setIsEditingEmail(true)}
                        style={{ padding: "0.5rem 1rem", minHeight: "auto", fontSize: "0.875rem" }}
                      >
                        Change Email
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleChangeEmail}>
                    <p style={{ marginBottom: "1rem", color: "var(--text-secondary)" }}>
                      A verification link will be sent to the new email address. Your email won&apos;t change until you verify the new address.
                    </p>
                    <input
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="New email address"
                      required
                      style={{
                        width: "100%",
                        padding: "0.75rem",
                        borderRadius: "8px",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                        background: "rgba(0, 0, 0, 0.2)",
                        color: "white",
                        marginBottom: "1rem"
                      }}
                    />
                    <div style={{ display: "flex", gap: "1rem" }}>
                      <button 
                        type="submit" 
                        disabled={isSubmitting || !newEmail || newEmail === user.email}
                        style={{
                          padding: "0.5rem 1rem",
                          borderRadius: "8px",
                          border: "none",
                          background: "var(--accent)",
                          color: "var(--bg)",
                          fontWeight: 600,
                          cursor: "pointer"
                        }}
                      >
                        Update
                      </button>
                      <button 
                        type="button" 
                        onClick={() => { setIsEditingEmail(false); setNewEmail(""); }}
                        style={{
                          padding: "0.5rem 1rem",
                          borderRadius: "8px",
                          border: "1px solid rgba(255, 255, 255, 0.2)",
                          background: "transparent",
                          color: "white",
                          cursor: "pointer"
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>

            <div className={`glass-panel ${styles.orderCard}`} style={{ marginBottom: "2rem" }}>
              <div className={styles.orderHeader}>
                <h2 style={{ fontSize: "1.25rem", margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span className="material-symbols-outlined">password</span>
                  Password
                </h2>
              </div>
              <div className={styles.orderBody} style={{ padding: "1.5rem" }}>
                <p style={{ marginBottom: "1rem" }}>
                  A password reset link will be sent to your email address: <strong>{user.email}</strong>
                </p>
                <button 
                  className={styles.actionBtn} 
                  onClick={handleResetPassword}
                  disabled={isSubmitting}
                  style={{ padding: "0.5rem 1rem", minHeight: "auto", fontSize: "0.875rem", width: "fit-content" }}
                >
                  Send Password Reset Link
                </button>
              </div>
            </div>



          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
