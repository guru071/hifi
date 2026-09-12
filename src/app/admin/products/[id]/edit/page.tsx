"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import styles from '../../../page.module.css';

type EditableProduct = {
  title: string;
  base_price: number | string;
  delivery_fee?: number | string | null;
  description?: string | null;
  category_id?: string | null;
  image_url?: string | null;
};

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [descText, setDescText] = useState("");
  const [descFabric, setDescFabric] = useState("");
  const [descPrinting, setDescPrinting] = useState("");
  const [descShipping, setDescShipping] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [product, setProduct] = useState<EditableProduct | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [uploading, setUploading] = useState(false);
  const [deliveryType, setDeliveryType] = useState("global");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [categories, setCategories] = useState<{id:string, name:string}[]>([]);

  useEffect(() => {
    fetch("/api/categories").then(r => r.json()).then(d => setCategories(d.categories || [])).catch(console.error);
  }, []);

  useEffect(() => {
    async function loadProduct() {
      try {
        const res = await fetch(`/api/products/${id}`);
        if (!res.ok) throw new Error("Failed to load product");
        const data = await res.json();
        setProduct(data.product);
        if (data.product.description && data.product.description.startsWith('{')) {
          try {
            const parsed = JSON.parse(data.product.description);
            setDescText(parsed.text || "");
            setDescFabric(parsed.fabric || "");
            setDescPrinting(parsed.printing || "");
            setDescShipping(parsed.shipping || "");
          } catch(e) {
            setDescText(data.product.description);
          }
        } else {
          setDescText(data.product.description || "");
        }
        if (data.product.image_url) {
          setImageUrl(data.product.image_url);
          setImagePreview(data.product.image_url);
        }
        if (data.product.delivery_fee === null) {
          setDeliveryType("global");
        } else if (Number(data.product.delivery_fee) === 0) {
          setDeliveryType("free");
        } else {
          setDeliveryType("custom");
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
      setImagePreview(product?.image_url ?? "");
      setImageUrl(product?.image_url ?? "");
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
      subtitle: formData.get("mrp") ? String(formData.get("mrp")) : null,
      delivery_fee: formData.get("delivery_type") === "global" ? null : (formData.get("delivery_type") === "free" ? 0 : Number(formData.get("delivery_fee_custom") || 0)),
      description: JSON.stringify({
        text: formData.get("description") || "",
        fabric: formData.get("fabric") || "",
        printing: formData.get("printing") || "",
        shipping: formData.get("shipping") || ""
      }),
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
  if (!product) return <div style={{ padding: '2rem', color: 'var(--color-error)' }}>{error || "Product not found"}</div>;

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
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Delivery Fee</label>
            <select name="delivery_type" value={deliveryType} onChange={(e) => setDeliveryType(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-outline)', marginBottom: '0.5rem' }}>
              <option value="global">Global Fee (Uses default from Settings)</option>
              <option value="free">Free Delivery (₹0 for this product)</option>
              <option value="custom">Custom Fee (Per product)</option>
            </select>
            {deliveryType === "custom" && (
              <input name="delivery_fee_custom" defaultValue={product.delivery_fee ?? ""} min="0" step="0.01" type="number" placeholder="Enter custom fee in INR" required style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-outline)' }} />
            )}
          </div>
          <div style={{ padding: '1rem', background: 'var(--color-surface-variant)', borderRadius: 'var(--radius-md)', margin: '1rem 0' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Product Details & Tabs</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>Main Description</label>
                <textarea name="description" defaultValue={descText} rows={3} style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-outline)', resize: 'vertical' }}></textarea>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>Fabric & Fit</label>
                <textarea name="fabric" defaultValue={descFabric} rows={2} style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-outline)', resize: 'vertical' }}></textarea>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>Printing Process</label>
                <textarea name="printing" defaultValue={descPrinting} rows={2} style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-outline)', resize: 'vertical' }}></textarea>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>Shipping</label>
                <textarea name="shipping" defaultValue={descShipping} rows={2} style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-outline)', resize: 'vertical' }}></textarea>
              </div>
            </div>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Category</label>
            <select name="category_id" defaultValue={product.category_id || ""} style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-outline)', background: 'var(--color-surface)' }}>
              <option value="">None</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
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
