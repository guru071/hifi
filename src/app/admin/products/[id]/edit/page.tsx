"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import styles from '../../../page.module.css';

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  type EditableProduct = {
    title: string;
    base_price: number;
    delivery_fee?: number | null;
    description?: string | null;
    category_id?: string | null;
    image_url?: string | null;
  };

  const [product, setProduct] = useState<EditableProduct | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadProduct() {
      try {
        const res = await fetch(`/api/products/${id}`);
        if (!res.ok) throw new Error("Failed to load product");
        const data = await res.json();
        setProduct(data.product);
        if (data.product.image_url) {
          setImageUrl(data.product.image_url);
          setImagePreview(data.product.image_url);
        }
      } catch (err) {
        if (err instanceof Error) setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    if (id) loadProduct();
  }, [id]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const localPreview = URL.createObjectURL(file);
    setImagePreview(localPreview);
    setUploading(true);
    setError("");

    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setImageUrl(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Image upload failed");
      setImagePreview(product?.image_url || "");
      setImageUrl(product?.image_url || "");
    } finally {
      setUploading(false);
    }
  };

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
      image_url: imageUrl || null,
    };

    try {
      const res = await fetch(`/api/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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
  if (!product) return <div style={{ padding: '2rem' }}>Product not found.</div>;

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

          {/* Image Upload */}
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Product Image</label>
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                width: '100%',
                minHeight: '160px',
                border: '2px dashed var(--color-outline)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                overflow: 'hidden',
                position: 'relative',
                background: 'var(--color-surface-variant, rgba(255,255,255,0.04))',
              }}
            >
              {imagePreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imagePreview}
                  alt="Preview"
                  style={{ width: '100%', height: '200px', objectFit: 'cover' }}
                />
              ) : (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-on-surface-variant, #888)' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📷</div>
                  <p style={{ margin: 0, fontWeight: 500 }}>Click to change image</p>
                  <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem' }}>JPEG, PNG, WEBP, GIF · Max 5MB</p>
                </div>
              )}
              {uploading && (
                <div style={{
                  position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 600
                }}>
                  Uploading...
                </div>
              )}
              {imagePreview && !uploading && (
                <div style={{
                  position: 'absolute', bottom: 8, right: 8,
                  background: 'rgba(0,0,0,0.6)', color: '#fff',
                  padding: '0.25rem 0.6rem', borderRadius: '999px', fontSize: '0.75rem'
                }}>
                  Click to change
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            {imageUrl && !uploading && (
              <p style={{ fontSize: '0.78rem', marginTop: '0.4rem', color: 'var(--color-success, #22c55e)' }}>
                ✓ Image ready
              </p>
            )}
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Category ID</label>
            <input name="category_id" defaultValue={product.category_id || ""} type="text" style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-outline)' }} />
          </div>
          <button
            disabled={saving || uploading}
            type="submit"
            style={{
              padding: '0.75rem',
              backgroundColor: 'var(--color-primary)',
              color: 'var(--color-on-primary)',
              borderRadius: 'var(--radius-full)',
              fontWeight: 600,
              border: 'none',
              cursor: (saving || uploading) ? 'not-allowed' : 'pointer',
              marginTop: '1rem',
              opacity: (saving || uploading) ? 0.7 : 1
            }}
          >
            {saving ? "Saving..." : "Update Product"}
          </button>
        </form>
      </div>
    </div>
  );
}
