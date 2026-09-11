"use client";

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../../page.module.css';

export default function CreateProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [uploading, setUploading] = useState(false);
  const [deliveryType, setDeliveryType] = useState("global");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [variants, setVariants] = useState([{ id: Date.now(), color: "", size: "", stock: 10, image_url: "", image_preview: "", uploading: false }]);

  const handleVariantFile = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const newVariants = [...variants];
    newVariants[index].image_preview = URL.createObjectURL(file);
    newVariants[index].uploading = true;
    setVariants(newVariants);

    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error("Upload failed");

      setVariants(prev => prev.map((v, idx) => idx === index ? { ...v, image_url: data.url, uploading: false } : v));
    } catch (err) {
      console.error(err);
      setVariants(prev => prev.map((v, idx) => idx === index ? { ...v, image_url: "", image_preview: "", uploading: false } : v));
    }
  };

  const addVariant = () => setVariants([...variants, { id: Date.now(), color: "", size: "", stock: 10, image_url: "", image_preview: "", uploading: false }]);
  const removeVariant = (id: number) => setVariants(variants.filter(v => v.id !== id));
  const updateVariant = (id: number, field: string, value: any) => {
    setVariants(variants.map(v => v.id === id ? { ...v, [field]: value } : v));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show local preview immediately
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
      setImagePreview("");
      setImageUrl("");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const payload = {
      title: formData.get("title"),
      base_price: Number(formData.get("base_price")),
      subtitle: formData.get("mrp") ? String(formData.get("mrp")) : null,
      delivery_fee: formData.get("delivery_type") === "global" ? null : (formData.get("delivery_type") === "free" ? 0 : Number(formData.get("delivery_fee_custom") || 0)),
      description: formData.get("description"),
      category_id: formData.get("category_id") || null,
      image_url: imageUrl || null,
      custom_variants: variants,
    };

    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--color-primary)' }}>Selling Price (₹) *</label>
              <input name="base_price" required min="0" step="0.01" type="number" style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '2px solid var(--color-primary)', background: 'var(--color-surface)' }} placeholder="e.g. 999" />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>MRP (Strikethrough ₹)</label>
              <input name="mrp" min="0" step="0.01" type="number" style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-outline)' }} placeholder="e.g. 1499" />
            </div>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Delivery Fee</label>
            <select name="delivery_type" value={deliveryType} onChange={(e) => setDeliveryType(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-outline)', marginBottom: '0.5rem' }}>
              <option value="global">Global Fee (Uses default from Settings)</option>
              <option value="free">Free Delivery (₹0 for this product)</option>
              <option value="custom">Custom Fee (Per product)</option>
            </select>
            {deliveryType === "custom" && (
              <input name="delivery_fee_custom" min="0" step="0.01" type="number" placeholder="Enter custom fee in INR" required style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-outline)' }} />
            )}
          </div>
                    <div style={{ padding: '1rem', background: 'var(--color-surface-variant)', borderRadius: 'var(--radius-md)' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Variants (Colors & Sizes)</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-on-surface-variant)', marginBottom: '1rem' }}>Add each specific combination of Color and Size, and upload a specific image for it.</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {variants.map((v, i) => (
                <div key={v.id} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', background: 'var(--color-surface)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-outline)' }}>
                  <input placeholder="Color (e.g. Red)" value={v.color} onChange={e => updateVariant(v.id, 'color', e.target.value)} required style={{ flex: 1, padding: '0.5rem', border: '1px solid var(--color-outline)', borderRadius: '4px' }} />
                  <input placeholder="Size (e.g. M)" value={v.size} onChange={e => updateVariant(v.id, 'size', e.target.value)} required style={{ flex: 1, padding: '0.5rem', border: '1px solid var(--color-outline)', borderRadius: '4px' }} />
                  <input type="number" min="0" placeholder="Stock" value={v.stock} onChange={e => updateVariant(v.id, 'stock', e.target.value)} required style={{ width: '80px', padding: '0.5rem', border: '1px solid var(--color-outline)', borderRadius: '4px' }} />
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
                    <label style={{ padding: '0.5rem', background: 'var(--color-outline)', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                      {v.uploading ? 'Uploading...' : (v.image_url ? 'Change Image' : 'Upload Image')}
                      <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleVariantFile(i, e)} />
                    </label>
                    {v.image_preview && <img src={v.image_preview} style={{ width: 32, height: 32, objectFit: 'cover', borderRadius: '4px' }} />}
                  </div>

                  <button type="button" onClick={() => removeVariant(v.id)} style={{ color: 'red', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.2rem', padding: '0 0.5rem' }}>×</button>
                </div>
              ))}
            </div>
            
            <button type="button" onClick={addVariant} style={{ marginTop: '1rem', padding: '0.5rem 1rem', background: 'var(--color-primary)', color: 'var(--color-on-primary)', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
              + Add Variant
            </button>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Description</label>
            <textarea name="description" rows={4} style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-outline)', resize: 'vertical' }} placeholder="Product details..."></textarea>
          </div>

          {/* Image Upload */}
          <div>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600 }}>Main Product Image</label>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-on-surface-variant)', marginBottom: '0.75rem' }}>This image will be used as the main thumbnail in the storefront grid.</p>
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
                transition: 'border-color 0.2s',
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
                  <p style={{ margin: 0, fontWeight: 500 }}>Click to upload image</p>
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
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            {imageUrl && (
              <p style={{ fontSize: '0.78rem', marginTop: '0.4rem', color: 'var(--color-success, #22c55e)' }}>
                ✓ Image uploaded successfully
              </p>
            )}
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Category ID</label>
            <input name="category_id" type="text" style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-outline)' }} placeholder="UUID of category" />
          </div>
          <button
            disabled={loading || uploading}
            type="submit"
            style={{
              padding: '0.75rem',
              backgroundColor: 'var(--color-primary)',
              color: 'var(--color-on-primary)',
              borderRadius: 'var(--radius-full)',
              fontWeight: 600,
              border: 'none',
              cursor: (loading || uploading) ? 'not-allowed' : 'pointer',
              marginTop: '1rem',
              opacity: (loading || uploading) ? 0.7 : 1
            }}
          >
            {loading ? "Saving..." : "Save Product"}
          </button>
        </form>
      </div>
    </div>
  );
}
