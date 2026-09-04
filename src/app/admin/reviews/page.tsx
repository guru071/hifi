"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import styles from "./page.module.css";

type AdminReview = {
  id: string;
  product_id: string;
  rating: number;
  created_at: string;
  is_visible: boolean;
  comment?: string;
  users?: {
    full_name: string;
  };
  [key: string]: unknown;
};

type AdminProduct = {
  id: string;
  title: string;
  [key: string]: unknown;
};

export default function AdminReviews() {
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showHidden, setShowHidden] = useState(false);
  const [msg, setMsg] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      // Admin session → /api/reviews returns all reviews (incl. hidden)
      const [revRes, prodRes] = await Promise.all([
        fetch("/api/reviews", { cache: "no-store" }),
        fetch("/api/products?includeInactive=true", { cache: "no-store" }),
      ]);
      if (!revRes.ok) throw new Error("Failed to fetch reviews");
      const revData = await revRes.json();
      setReviews(revData.reviews || []);
      const prodData = await prodRes.json();
      setProducts(prodData.products || []);
    } catch (e: unknown) {
      if (e instanceof Error) setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const initLoad = async () => {
      await load();
    };
    initLoad();
  }, []);

  const productTitle = (id: string) => products.find(p => p.id === id)?.title || "Product";
  const filtered = showHidden ? reviews.filter(r => !r.is_visible) : reviews;

  async function setVisible(r: AdminReview, visible: boolean) {
    try {
      const res = await fetch(`/api/reviews/${r.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_visible: visible }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");
      setMsg(visible ? "Review approved and visible to customers." : "Review hidden from storefront.");
      load();
    } catch (e: unknown) {
      if (e instanceof Error) setError(e.message);
    }
  }

  async function removeReview(r: AdminReview) {
    if (!window.confirm("Delete this review permanently?")) return;
    try {
      const res = await fetch(`/api/reviews/${r.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Delete failed");
      setMsg("Review deleted.");
      load();
    } catch (e: unknown) {
      if (e instanceof Error) setError(e.message);
    }
  }

  return (
    <>
      <header className={styles.header}>
        <div>
          <h2 className={styles.title}>Review Moderation</h2>
          <p className={styles.subtitle}>Approve, hide, or remove customer reviews.</p>
        </div>
        <button className={styles.toggleBtn} onClick={() => setShowHidden(v => !v)}>
          {showHidden ? `Showing hidden (${reviews.filter(r => !r.is_visible).length})` : "View hidden reviews"}
        </button>
      </header>

      {msg && <p style={{ color: "var(--color-primary)", marginBottom: "0.75rem" }}>{msg}</p>}
      {error && <p style={{ color: "var(--color-error)", marginBottom: "0.75rem" }}>{error}</p>}
      {loading && <p>Loading reviews...</p>}
      {!loading && filtered.length === 0 && <p>{showHidden ? "No hidden reviews." : "No reviews yet. Approved reviews will appear here once customers submit them."}</p>}

      {!loading && filtered.map(r => (
        <div key={r.id} className={`glass-panel ${styles.reviewCard}`} style={{ opacity: r.is_visible ? 1 : 0.65 }}>
          <div className={styles.reviewHeader}>
            <div>
              <div className={styles.name}>{r.users?.full_name || "Customer"}</div>
              <div className={styles.meta}>
                <Link href={`/product/${r.product_id}`} style={{ color: "var(--color-primary)" }}>{productTitle(r.product_id)}</Link>
                {' · '}★ {r.rating}/5
                {' · '}{new Date(r.created_at).toLocaleDateString()}
              </div>
            </div>
            <span className={`${styles.badge} ${r.is_visible ? styles.badgeActive : styles.badgeHidden}`}>
              {r.is_visible ? "Visible" : "Hidden"}
            </span>
          </div>
          <p className={styles.comment}>{r.comment || <em style={{ color: "var(--color-on-surface-variant)" }}>No comment</em>}</p>
          <div className={styles.actions}>
            {!r.is_visible && <button className={styles.primaryBtn} onClick={() => setVisible(r, true)}>Approve</button>}
            {r.is_visible && <button className={styles.secondaryBtn} onClick={() => setVisible(r, false)}>Hide</button>}
            <button className={styles.dangerBtn} onClick={() => removeReview(r)}>Delete</button>
          </div>
        </div>
      ))}
    </>
  );
}