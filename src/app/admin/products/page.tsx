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

  // per-variant inline edits
  const [stockEdits, setStockEdits] = useState<Record<string, string>>({});
  const [priceEdits, setPriceEdits] = useState<Record<string, string>>({});

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
    // Prevent synchronous setState by moving loading state management out of the synchronous part
    const fetchIt = async () => {
      await loadAll();
    };
    fetchIt();
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
      setMsg(editingId ? "Product updated." : "Product created.");
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
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: catName.trim(), description: catDesc.trim() || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create category");
      setCatName("");
      setCatDesc("");
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
        <button className={styles.primaryBtn} onClick={openCreate}>+ New Product</button>
      </header>

      {msg && <p style={{ color: "var(--color-primary)", marginBottom: "0.75rem" }}>{msg}</p>}
      {err && <p style={{ color: "var(--color-error)", marginBottom: "0.75rem" }}>{err}</p>}

      {showForm && (
        <div className={`glass-panel ${styles.formPanel}`}>
          <h3 className={styles.panelTitle}>{editingId ? "Edit Product" : "New Product"}</h3>
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
              Image URL
              <input className={styles.input} value={form.image_url} onChange={e => setForm({ ...form, image_url: e.target.value })} placeholder="https://..." />
            </label>
            <label className={styles.inputGroup}>
              Category
              <select className={styles.input} value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })}>
                <option value="">Uncategorized</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>
            <label className={styles.inputGroup} style={{ gridColumn: "1 / -1" }}>
              Description
              <textarea className={styles.input} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} style={{ minHeight: "5rem", resize: "vertical" }} />
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
          <form onSubmit={createCategory} className={styles.catForm}>
            <input className={styles.input} placeholder="Category name *" value={catName} onChange={e => setCatName(e.target.value)} required />
            <input className={styles.input} placeholder="Description (optional)" value={catDesc} onChange={e => setCatDesc(e.target.value)} />
            <button type="submit" className={styles.primaryBtn}>Add</button>
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

          {(p.product_variants || []).length > 0 && (
            <div className={styles.variantTable}>
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
                  <span>{v.color} / {v.size}</span>
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
                <button className={styles.secondaryBtn} onClick={() => saveVariants(p)}>Save Variants</button>
              </div>
            </div>
          )}
        </div>
      ))}
    </>
  );
}