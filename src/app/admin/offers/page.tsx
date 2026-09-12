"use client";
import React, { useState, useEffect } from 'react';
import styles from '../page.module.css';

export default function OffersPage() {
  const [categories, setCategories] = useState<{id:string, name:string}[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const [target, setTarget] = useState("all");
  const [targetCategory, setTargetCategory] = useState("");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [discountType, setDiscountType] = useState("percentage");
  const [discountValue, setDiscountValue] = useState("");

  useEffect(() => {
    fetch('/api/categories').then(r=>r.json()).then(d=>setCategories(d.categories || []));
  }, []);

  const handleApply = async () => {
    if (!discountValue || Number(discountValue) <= 0) {
      setErr("Enter a valid discount amount");
      return;
    }
    if (!confirm("This will permanently update the prices and MRPs for the selected products. Are you sure?")) return;
    
    setLoading(true);
    setMsg("");
    setErr("");
    try {
      const res = await fetch("/api/admin/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target, targetCategory, priceMin, priceMax, discountType, discountValue
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMsg(`Success! Updated ${data.updatedCount} products.`);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Apply Bulk Offers</h1>
          <p className={styles.subtitle}>Reduce prices and set MRP strikethroughs across multiple products at once.</p>
        </div>
      </div>

      <div className={`glass-panel ${styles.recentOrdersCard}`} style={{ maxWidth: '800px' }}>
        {msg && <div style={{ padding: '1rem', background: 'var(--color-success)', color: '#fff', borderRadius: '4px', marginBottom: '1rem' }}>{msg}</div>}
        {err && <div style={{ padding: '1rem', background: 'var(--color-error)', color: '#fff', borderRadius: '4px', marginBottom: '1rem' }}>{err}</div>}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Target Products</label>
            <select value={target} onChange={e=>setTarget(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-outline)', background: 'var(--color-surface)' }}>
              <option value="all">All Products</option>
              <option value="category">Specific Category</option>
              <option value="price">Specific Price Range</option>
            </select>
          </div>

          {target === "category" && (
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Select Category</label>
              <select value={targetCategory} onChange={e=>setTargetCategory(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-outline)', background: 'var(--color-surface)' }}>
                <option value="">-- Choose --</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          )}

          {target === "price" && (
            <div style={{ display: 'flex', gap: '1rem' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Min Price (₹)</label>
                <input type="number" value={priceMin} onChange={e=>setPriceMin(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-outline)' }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Max Price (₹)</label>
                <input type="number" value={priceMax} onChange={e=>setPriceMax(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-outline)' }} />
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Discount Type</label>
              <select value={discountType} onChange={e=>setDiscountType(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-outline)', background: 'var(--color-surface)' }}>
                <option value="percentage">% Percentage Off</option>
                <option value="flat">₹ Flat Amount Off</option>
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Discount Value</label>
              <input type="number" value={discountValue} onChange={e=>setDiscountValue(e.target.value)} placeholder="e.g. 20" style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-outline)' }} />
            </div>
          </div>

          <div style={{ padding: '1rem', background: 'var(--color-surface-variant)', borderRadius: '4px', fontSize: '0.9rem' }}>
            <strong>How it works:</strong> This will automatically set the current price as the MRP (crossed out), and reduce the selling price by your discount amount.
          </div>

          <button disabled={loading} onClick={handleApply} style={{ padding: '1rem', background: 'var(--color-primary)', color: 'var(--color-on-primary)', borderRadius: 'var(--radius-full)', border: 'none', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer' }}>
            {loading ? "Applying Discount..." : "Apply Bulk Discount"}
          </button>
        </div>
      </div>
    </div>
  );
}
