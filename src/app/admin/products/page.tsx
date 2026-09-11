"use client";

import React, { useState, useEffect } from "react";
import styles from "./page.module.css";

const inr = (n: number) => `₹${Number(n).toFixed(2)}`;

const emptyForm = {
  title: "",
  subtitle: "",
  description: "",
  base_price: "",
  image_url: "",
  category_id: "",
  delivery_fee: "",
  is_active: true,
};

type AdminProduct = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  base_price: number | string;
  image_url: string;
  category_id: string;
  category_name?: string;
  delivery_fee?: number | string;
  is_active: boolean;
  product_variants?: {
    id: string;
    inventory_count: number;
    price_adjustment: number;
    size?: string;
    color?: string;
    sku?: string;
  }[];
  [key: string]: unknown;
};

type AdminCategory = {
  id: string;
  name: string;
  description?: string;
  [key: string]: unknown;
};

export default function AdminProducts() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  // create/edit form
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  // category form
  const [catName, setCatName] = useState("");
  const [catDesc, setCatDesc] = useState("");
  const [catImg, setCatImg] = useState<File | null>(null);

  // per-variant inline edits
  const [stockEdits, setStockEdits] = useState<Record<string, string>>({});
  const [priceEdits, setPriceEdits] = useState<Record<string, string>>({});

  // new variant form per product
  const [newVariant, setNewVariant] = useState<{ productId: string, color: string, size: string, inventory_count: string, price_adjustment: string, file: File | null } | null>(null);

  async function handleMainImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setMsg("Uploading main image...");
    setErr("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setForm({ ...form, image_url: data.url });
      setMsg("Image uploaded successfully.");
    } catch (e: any) {
      setErr(e.message || "Failed to upload image");
    }
  }

  async function uploadVariantImage(variantId: string, productId: string, file: File | null) {
    if (!file) return;
    try {
      setMsg("Uploading variant image...");
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      
      const variant = products.flatMap(p => p.product_variants || []).find(v => v.id === variantId);
      if (variant) {
        const baseColor = (variant.color || '').split('[IMG:')[0].trim();
        const newColor = `${baseColor} [IMG:${data.url}]`;
        
        const saveRes = await fetch(`/api/products/${productId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ variants: [{ id: variantId, color: newColor }] })
        });
        if (!saveRes.ok) throw new Error("Failed to save variant image");
        
        setMsg("Variant image updated!");
        loadAll();
      }
    } catch (e: unknown) {
      if (e instanceof Error) setErr(e.message);
    }
  }

  async function handleCreateVariant(e: React.FormEvent) {
    e.preventDefault();
    if (!newVariant) return;
    setMsg("Creating variant...");
    setErr("");
    try {
      let finalColor = newVariant.color.trim();

      // If an image was provided for the new variant, upload it first
      if (newVariant.file) {
        const fd = new FormData();
        fd.append("file", newVariant.file);
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Image upload failed");
        finalColor = `${finalColor} [IMG:${data.url}]`;
      }

      const res = await fetch(`/api/products/${newVariant.productId}/variants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          color: finalColor,
          size: newVariant.size.trim() || "One Size",
          inventory_count: Number(newVariant.inventory_count) || 0,
          price_adjustment: Number(newVariant.price_adjustment) || 0
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create variant");
      
      setMsg("Variant created successfully!");
      setNewVariant(null);
      loadAll();
    } catch (e: unknown) {
      if (e instanceof Error) setErr(e.message);
    }
  }

  async function loadAll() {
    try {
      const [prodRes, catRes] = await Promise.all([
        fetch("/api/products?includeInactive=true", { cache: "no-store" }),
        fetch("/api/categories", { cache: "no-store" }),
      ]);
      if (!prodRes.ok) throw new Error("Failed to fetch products");
      const prodData = await prodRes.json();
      setProducts(prodData.products || []);
      const catData = await catRes.json();
      setCategories(catData.categories || []);
    } catch (e: unknown) {
      if (e instanceof Error) setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  }

  function openEdit(p: AdminProduct) {
    setEditingId(p.id);
    setForm({
      title: p.title || "",
      subtitle: p.subtitle || "",
      description: p.description || "",
      base_price: String(p.base_price ?? ""),
      image_url: p.image_url || "",
      category_id: p.category_id || "",
      delivery_fee: p.delivery_fee != null ? String(p.delivery_fee) : "",
      is_active: !!p.is_active,
    });
    setShowForm(true);
  }

  async function saveProduct(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    setErr("");
    const payload = {
      title: form.title.trim(),
      subtitle: form.subtitle.trim() || null,
      description: form.description.trim() || null,
      base_price: Number(form.base_price),
      image_url: form.image_url.trim() || null,
      category_id: form.category_id || null,
      delivery_fee: form.delivery_fee !== "" ? Number(form.delivery_fee) : 10,
      is_active: form.is_active,
    };
    if (!payload.title || Number.isNaN(payload.base_price) || payload.base_price < 0) {
      setErr("Title and a valid base price are required.");
      return;
    }
    if (!payload.image_url) {
      setErr("Product image is required.");
      return;
    }
    try {
      const res = editingId
        ? await fetch(`/api/products/${editingId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/products", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setMsg(editingId ? "Product updated." : "Product created. You can now add variants.");
      setShowForm(false);
      loadAll();
    } catch (e: unknown) {
      if (e instanceof Error) setErr(e.message);
    }
  }

  async function saveVariants(p: AdminProduct) {
    setMsg("");
    setErr("");
    const variants = (p.product_variants || [])
      .map((v: { id: string; inventory_count: number; price_adjustment: number }) => ({
        id: v.id,
        ...(stockEdits[v.id] !== undefined ? { inventory_count: Number(stockEdits[v.id]) } : {}),
        ...(priceEdits[v.id] !== undefined ? { price_adjustment: Number(priceEdits[v.id]) } : {}),
      }))
      .filter((v: { id: string }) => stockEdits[v.id] !== undefined || priceEdits[v.id] !== undefined);
    if (variants.length === 0) {
      setErr("Change a variant value first, then save.");
      return;
    }
    try {
      const res = await fetch(`/api/products/${p.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variants }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setStockEdits({});
      setPriceEdits({});
      setMsg("Variants saved.");
      loadAll();
    } catch (e: unknown) {
      if (e instanceof Error) setErr(e.message);
    }
  }

  async function toggleActive(p: AdminProduct) {
    try {
      const res = await fetch(`/api/products/${p.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !p.is_active }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");
      setMsg(p.is_active ? "Product hidden from storefront." : "Product visible on storefront.");
      loadAll();
    } catch (e: unknown) {
      if (e instanceof Error) setErr(e.message);
    }
  }

  async function deleteProduct(p: AdminProduct) {
    if (!window.confirm(`Delete "${p.title}"?\n\nThis will permanently remove the product and its image. This cannot be undone.`)) return;
    setMsg("");
    setErr("");
    try {
      const res = await fetch(`/api/products/${p.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Delete failed");
      setMsg(`"${p.title}" deleted successfully.`);
      loadAll();
    } catch (e: unknown) {
      if (e instanceof Error) setErr(e.message);
    }
  }

  async function createCategory(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    setErr("");
    if (!catName.trim()) {
      setErr("Category name is required.");
      return;
    }
    try {
      let image_url = null;
      if (catImg) {
        const fd = new FormData();
        fd.append("file", catImg);
        const upRes = await fetch("/api/upload", { method: "POST", body: fd });
        const upData = await upRes.json();
        if (upRes.ok) image_url = upData.url;
      }

      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: catName.trim(), description: catDesc.trim() || null, image_url }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create category");
      setCatName("");
      setCatDesc("");
      setCatImg(null);
      setMsg(`Category "${data.category.name}" created.`);
      const catData = await (await fetch("/api/categories", { cache: "no-store" })).json();
      setCategories(catData.categories || []);
    } catch (e: unknown) {
      if (e instanceof Error) setErr(e.message);
    }
  }

  return (
    <>
      <header className={styles.header}>
        <div>
          <h2 className={styles.title}>Products</h2>
          <p className={styles.subtitle}>Catalog, variants, and stock management.</p>
        </div>
        <a href="/admin/products/create" className={styles.primaryBtn} style={{ textDecoration: "none", display: "inline-block", textAlign: "center" }}>+ New Product</a>
      </header>

      {msg && <p style={{ color: "var(--color-primary)", marginBottom: "0.75rem" }}>{msg}</p>}
      {err && <p style={{ color: "var(--color-error)", marginBottom: "0.75rem" }}>{err}</p>}

      {showForm && (
        <div className={`glass-panel ${styles.formPanel}`}>
          <h3 className={styles.panelTitle}>{editingId ? "Edit Product" : "New Product"}</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>
            {editingId ? "Update product details." : "Create the main product first. You can add color variants and variant images after creating."}
          </p>
          <form onSubmit={saveProduct} className={styles.formGrid}>
            <label className={styles.inputGroup}>
              Title *
              <input className={styles.input} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
            </label>
            <label className={styles.inputGroup}>
              Subtitle
              <input className={styles.input} value={form.subtitle} onChange={e => setForm({ ...form, subtitle: e.target.value })} />
            </label>
            <label className={styles.inputGroup}>
              Base Price (INR) *
              <input className={styles.input} type="number" min="0" step="0.01" value={form.base_price} onChange={e => setForm({ ...form, base_price: e.target.value })} required />
            </label>
            <label className={styles.inputGroup}>
              Delivery Fee (INR)
              <input className={styles.input} type="number" min="0" step="0.01" value={form.delivery_fee} onChange={e => setForm({ ...form, delivery_fee: e.target.value })} />
            </label>
            <label className={styles.inputGroup}>
              Main Product Image *
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <input type="file" accept="image/*" onChange={handleMainImageUpload} style={{ display: 'none' }} id="mainImageUpload" />
                <label htmlFor="mainImageUpload" className={styles.secondaryBtn} style={{ cursor: 'pointer' }}>
                  Choose Image
                </label>
                {form.image_url && (
                  <img src={form.image_url} alt="Preview" style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4 }} />
                )}
              </div>
            </label>
            <label className={styles.inputGroup}>
              Category
              <select className={styles.input} value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })}>
                <option value="">Uncategorized</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>
            <label className={styles.inputGroup} style={{ gridColumn: "1 / -1" }}>
              Product Details (Description)
              <textarea className={styles.input} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} style={{ minHeight: "5rem", resize: "vertical" }} placeholder="Enter detailed product description here..." />
            </label>
            <label className={styles.inputGroup} style={{ gridColumn: "1 / -1" }}>
              <input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} style={{ marginRight: "0.5rem" }} />
              Visible on storefront
            </label>
            <div className={styles.formActions}>
              <button type="submit" className={styles.primaryBtn}>{editingId ? "Save Changes" : "Create Product"}</button>
              <button type="button" className={styles.secondaryBtn} onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className={`glass-panel ${styles.catPanel}`}>
        <h3 className={styles.panelTitle}>Categories</h3>
        <div className={styles.catManage}>
          <form onSubmit={createCategory} className={styles.catForm} style={{ alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
              <input className={styles.input} placeholder="Category name *" value={catName} onChange={e => setCatName(e.target.value)} required />
              <input className={styles.input} placeholder="Description (optional)" value={catDesc} onChange={e => setCatDesc(e.target.value)} />
              <input type="file" accept="image/*" onChange={e => setCatImg(e.target.files?.[0] || null)} style={{ fontSize: '12px' }} />
            </div>
            <button type="submit" className={styles.primaryBtn} style={{ marginTop: '0.5rem' }}>Add</button>
          </form>
          <div className={styles.catList}>
            {categories.map(c => (
              <span key={c.id} className={styles.catChip}>{c.name} <em>({products.filter(p => p.category_id === c.id).length})</em></span>
            ))}
            {categories.length === 0 && <span className={styles.subtitle}>No categories yet.</span>}
          </div>
        </div>
      </div>

      {loading && <p>Loading products...</p>}
      {error && <p style={{ color: "var(--color-error)" }}>{error}</p>}
      {!loading && products.length === 0 && <p>No products yet. Create your first product.</p>}

      {!loading && products.map(p => (
        <div key={p.id} className={`glass-panel ${styles.productCard}`} style={{ opacity: p.is_active ? 1 : 0.6 }}>
          <div className={styles.productRow}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.image_url} alt={p.title} className={styles.thumb} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            <div className={styles.productInfo}>
              <div className={styles.productTitle}>
                {p.title}
                {!p.is_active && <span className={`${styles.badge} ${styles.badgeHidden}`}>Hidden</span>}
              </div>
              <div className={styles.subtitle}>
                {p.category_name || "Uncategorized"} · {inr(Number(p.base_price))}
                {p.delivery_fee != null && ` · Delivery ${inr(Number(p.delivery_fee))}`}
              </div>
            </div>
            <div className={styles.productActions}>
              <button className={styles.secondaryBtn} onClick={() => openEdit(p)}>Edit</button>
              <button className={styles.secondaryBtn} onClick={() => toggleActive(p)}>{p.is_active ? "Hide" : "Show"}</button>
              <button
                className={styles.secondaryBtn}
                style={{ color: 'var(--color-error, #ef4444)', borderColor: 'var(--color-error, #ef4444)' }}
                onClick={() => deleteProduct(p)}
              >Delete</button>
            </div>
          </div>

          <div className={styles.variantTable} style={{ marginTop: '1rem', borderTop: '1px solid var(--color-border)', paddingTop: '1rem' }}>
            <h4 style={{ fontSize: '1rem', marginBottom: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              Color Variants & Inventory
              <button 
                className={styles.secondaryBtn} 
                style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                onClick={() => setNewVariant({ productId: p.id, color: '', size: 'One Size', inventory_count: '', price_adjustment: '', file: null })}
              >
                + Add Variant
              </button>
            </h4>
            
            {(p.product_variants || []).length > 0 ? (
              <>
                <div className={styles.variantHeader}>
                  <span>Variant</span>
                  <span>Colors/Size</span>
                  <span>Stock</span>
                  <span>Adj.</span>
                  <span>Status</span>
                </div>
                {(p.product_variants || []).map((v: { id: string; size?: string; color?: string; inventory_count: number; price_adjustment: number; sku?: string }) => (
                  <div key={v.id} className={styles.variantRow}>
                    <span style={{ fontFamily: "monospace", fontSize: 12 }}>{v.sku || v.id.slice(0, 8)}</span>
                    <span>
                      {v.color?.split('[IMG:')[0].trim()} / {v.size}
                      {v.color?.includes('[IMG:') && <img src={v.color.split('[IMG:')[1].replace(']','')} style={{width:24, height:24, objectFit:'cover', marginLeft:8, borderRadius:4, verticalAlign:'middle'}} />}
                      <label style={{marginLeft: 8, fontSize: 10, cursor:'pointer', background:'var(--color-surface-variant)', padding:'2px 6px', borderRadius:4}}>
                        🖼️ Change Image
                        <input type="file" style={{display:'none'}} accept="image/*" onChange={(e) => uploadVariantImage(v.id, p.id, e.target.files?.[0] || null)} />
                      </label>
                    </span>
                    <input
                      type="number"
                      min="0"
                      className={styles.variantInput}
                      value={stockEdits[v.id] !== undefined ? stockEdits[v.id] : String(v.inventory_count ?? 0)}
                      onChange={e => setStockEdits({ ...stockEdits, [v.id]: e.target.value })}
                    />
                    <input
                      type="number"
                      step="0.01"
                      className={styles.variantInput}
                      value={priceEdits[v.id] !== undefined ? priceEdits[v.id] : String(v.price_adjustment ?? 0)}
                      onChange={e => setPriceEdits({ ...priceEdits, [v.id]: e.target.value })}
                    />
                    <span className={`${styles.badge} ${Number(v.inventory_count) > 0 ? styles.badgeActive : styles.badgeHidden}`}>
                      {Number(v.inventory_count) > 0 ? "In stock" : "Out of stock"}
                    </span>
                  </div>
                ))}
                <div className={styles.variantFooter}>
                  <button className={styles.secondaryBtn} onClick={() => saveVariants(p)}>Save Variant Updates</button>
                </div>
              </>
            ) : (
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>No variants yet. Add a variant to track stock and colors.</p>
            )}

            {newVariant?.productId === p.id && (
              <form onSubmit={handleCreateVariant} style={{ marginTop: '1rem', padding: '1rem', background: 'var(--color-surface-variant)', borderRadius: '8px' }}>
                <h5 style={{ marginBottom: '0.5rem', fontSize: '0.9rem' }}>New Variant</h5>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                  <input 
                    className={styles.input} style={{ flex: '1 1 120px' }} 
                    placeholder="Color (e.g. Red)" 
                    value={newVariant.color} 
                    onChange={e => setNewVariant({ ...newVariant, color: e.target.value })} 
                    required 
                  />
                  <input 
                    className={styles.input} style={{ flex: '1 1 100px' }} 
                    placeholder="Size" 
                    value={newVariant.size} 
                    onChange={e => setNewVariant({ ...newVariant, size: e.target.value })} 
                    required 
                  />
                  <input 
                    className={styles.input} style={{ flex: '1 1 80px' }} 
                    placeholder="Stock" 
                    type="number" min="0" 
                    value={newVariant.inventory_count} 
                    onChange={e => setNewVariant({ ...newVariant, inventory_count: e.target.value })} 
                  />
                  <input 
                    className={styles.input} style={{ flex: '1 1 100px' }} 
                    placeholder="Price Adj (INR)" 
                    type="number" step="0.01" 
                    value={newVariant.price_adjustment} 
                    onChange={e => setNewVariant({ ...newVariant, price_adjustment: e.target.value })} 
                  />
                  <div style={{ flex: '1 1 100%', display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
                    <label className={styles.secondaryBtn} style={{ cursor: 'pointer', flexShrink: 0 }}>
                      Upload Variant Image
                      <input 
                        type="file" accept="image/*" style={{ display: 'none' }} 
                        onChange={e => setNewVariant({ ...newVariant, file: e.target.files?.[0] || null })} 
                      />
                    </label>
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                      {newVariant.file ? newVariant.file.name : 'No image selected'}
                    </span>
                  </div>
                </div>
                <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                  <button type="submit" className={styles.primaryBtn}>Save Variant</button>
                  <button type="button" className={styles.secondaryBtn} onClick={() => setNewVariant(null)}>Cancel</button>
                </div>
              </form>
            )}
          </div>
        </div>
      ))}
    </>
  );
}
