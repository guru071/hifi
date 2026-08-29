"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../../page.module.css';

export default function CreateProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    const formData = new FormData(e.currentTarget);
    const payload = {
      title: formData.get("title"),
      base_price: Number(formData.get("base_price")),
      delivery_fee: Number(formData.get("delivery_fee") || 0),
      description: formData.get("description"),
      category_id: formData.get("category_id") || null,
      image_url: formData.get("image_url") || null
    };

    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create product");
      
      router.push("/admin/products");
    } catch (err) {
      if (err instanceof Error) setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Create Product</h1>
          <p className={styles.subtitle}>Add a new item to the catalog.</p>
        </div>
      </div>
      <div className={`glass-panel ${styles.recentOrdersCard}`}>
        {error && <p style={{ color: "var(--color-error)", marginBottom: "1rem" }}>{error}</p>}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Title *</label>
            <input name="title" required type="text" style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-outline)' }} placeholder="e.g. Heavyweight Tee" />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Base Price (₹) *</label>
            <input name="base_price" required min="0" step="0.01" type="number" style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-outline)' }} placeholder="1499" />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Delivery Fee (₹)</label>
            <input name="delivery_fee" min="0" step="0.01" type="number" defaultValue="0" style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-outline)' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Description</label>
            <textarea name="description" rows={4} style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-outline)', resize: 'vertical' }} placeholder="Product details..."></textarea>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Image URL</label>
            <input name="image_url" type="url" style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-outline)' }} placeholder="https://..." />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Category ID</label>
            <input name="category_id" type="text" style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-outline)' }} placeholder="UUID of category" />
          </div>
          <button disabled={loading} type="submit" style={{ padding: '0.75rem', backgroundColor: 'var(--color-primary)', color: 'var(--color-on-primary)', borderRadius: 'var(--radius-full)', fontWeight: 600, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', marginTop: '1rem', opacity: loading ? 0.7 : 1 }}>
            {loading ? "Saving..." : "Save Product"}
          </button>
        </form>
      </div>
    </div>
  );
}
