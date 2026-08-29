"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../../page.module.css';

export default function CreateCategoryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    const formData = new FormData(e.currentTarget);
    const payload = {
      name: formData.get("name"),
      slug: formData.get("slug"),
      description: formData.get("description")
    };

    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create category");
      
      router.push("/admin/categories");
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
          <h1 className={styles.title}>Create Category</h1>
          <p className={styles.subtitle}>Add a new collection to your catalog.</p>
        </div>
      </div>
      <div className={`glass-panel ${styles.recentOrdersCard}`}>
        {error && <p style={{ color: "var(--color-error)", marginBottom: "1rem" }}>{error}</p>}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Category Name *</label>
            <input name="name" required type="text" style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-outline)' }} placeholder="e.g. Summer Collection" />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Slug *</label>
            <input name="slug" required type="text" style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-outline)' }} placeholder="e.g. summer-collection" />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Description</label>
            <textarea name="description" rows={3} style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-outline)', resize: 'vertical' }} placeholder="Category description..."></textarea>
          </div>
          <button disabled={loading} type="submit" style={{ padding: '0.75rem', backgroundColor: 'var(--color-primary)', color: 'var(--color-on-primary)', borderRadius: 'var(--radius-full)', fontWeight: 600, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', marginTop: '1rem', opacity: loading ? 0.7 : 1 }}>
            {loading ? "Saving..." : "Save Category"}
          </button>
        </form>
      </div>
    </div>
  );
}
