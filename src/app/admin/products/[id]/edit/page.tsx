"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import styles from '../../../page.module.css';

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [product, setProduct] = useState<any>(null);

  useEffect(() => {
    async function loadProduct() {
      try {
        const res = await fetch(`/api/products/${id}`);
        if (!res.ok) throw new Error("Failed to load product");
        const data = await res.json();
        setProduct(data.product);
      } catch (err) {
        if (err instanceof Error) setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    if (id) loadProduct();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
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
      const res = await fetch(`/api/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update product");
      
      router.push("/admin/products");
    } catch (err) {
      if (err instanceof Error) setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ padding: '2rem' }}>Loading product...</div>;
  if (!product && error) return <div style={{ padding: '2rem', color: 'red' }}>{error}</div>;

  return (
    <div>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Edit Product</h1>
          <p className={styles.subtitle}>{product.title}</p>
        </div>
      </div>
      <div className={`glass-panel ${styles.recentOrdersCard}`}>
        {error && <p style={{ color: "var(--color-error)", marginBottom: "1rem" }}>{error}</p>}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Title *</label>
            <input name="title" defaultValue={product.title} required type="text" style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-outline)' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Base Price (₹) *</label>
            <input name="base_price" defaultValue={Number(product.base_price)} required min="0" step="0.01" type="number" style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-outline)' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Delivery Fee (₹)</label>
            <input name="delivery_fee" defaultValue={product.delivery_fee ?? 0} min="0" step="0.01" type="number" style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-outline)' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Description</label>
            <textarea name="description" defaultValue={product.description || ""} rows={4} style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-outline)', resize: 'vertical' }}></textarea>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Image URL</label>
            <input name="image_url" defaultValue={product.image_url || ""} type="url" style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-outline)' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Category ID</label>
            <input name="category_id" defaultValue={product.category_id || ""} type="text" style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-outline)' }} />
          </div>
          <button disabled={saving} type="submit" style={{ padding: '0.75rem', backgroundColor: 'var(--color-primary)', color: 'var(--color-on-primary)', borderRadius: 'var(--radius-full)', fontWeight: 600, border: 'none', cursor: saving ? 'not-allowed' : 'pointer', marginTop: '1rem', opacity: saving ? 0.7 : 1 }}>
            {saving ? "Saving..." : "Update Product"}
          </button>
        </form>
      </div>
    </div>
  );
}
