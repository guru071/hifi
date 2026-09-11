"use client";

import React, { useState, useEffect } from "react";
import styles from "../page.module.css";

type Coupon = {
  code: string;
  type: "flat" | "percentage";
  value: number;
  min_order: number;
  active: boolean;
};

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [newCode, setNewCode] = useState("");
  const [newType, setNewType] = useState<"flat" | "percentage">("percentage");
  const [newValue, setNewValue] = useState("");
  const [newMinOrder, setNewMinOrder] = useState("");

  useEffect(() => {
    async function fetchCoupons() {
      try {
        const res = await fetch("/api/admin/coupons");
        if (!res.ok) throw new Error("Failed to load coupons");
        const data = await res.json();
        setCoupons(data.coupons || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchCoupons();
  }, []);

  const saveCoupons = async (updatedCoupons: Coupon[]) => {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coupons: updatedCoupons })
      });
      if (!res.ok) throw new Error("Failed to save coupons");
      setCoupons(updatedCoupons);
    } catch (err: any) {
      setError(err.message || "Error saving");
    } finally {
      setSaving(false);
    }
  };

  const handleAdd = () => {
    if (!newCode.trim() || !newValue) {
      setError("Code and Value are required");
      return;
    }
    const exists = coupons.find(c => c.code.toUpperCase() === newCode.trim().toUpperCase());
    if (exists) {
      setError("Coupon code already exists");
      return;
    }
    const newCoupon: Coupon = {
      code: newCode.trim().toUpperCase(),
      type: newType,
      value: Number(newValue),
      min_order: Number(newMinOrder || 0),
      active: true,
    };
    saveCoupons([...coupons, newCoupon]);
    setNewCode("");
    setNewValue("");
    setNewMinOrder("");
  };

  const toggleStatus = (index: number) => {
    const updated = [...coupons];
    updated[index].active = !updated[index].active;
    saveCoupons(updated);
  };

  const handleDelete = (index: number) => {
    const updated = [...coupons];
    updated.splice(index, 1);
    saveCoupons(updated);
  };

  if (loading) return <div style={{ padding: '2rem' }}>Loading coupons...</div>;

  return (
    <>
      <header className={styles.header}>
        <div>
          <h2 className={styles.title}>Coupons & Discounts</h2>
          <p className={styles.subtitle}>Create promo codes for customers to apply at checkout.</p>
        </div>
      </header>

      {error && <p style={{ color: "red", marginBottom: "1rem" }}>{error}</p>}

      <div className={`glass-panel ${styles.recentOrdersCard}`}>
        <h3 className={styles.panelTitle}>Create New Coupon</h3>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end', marginTop: '1rem' }}>
          <div style={{ flex: '1 1 150px' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.25rem', fontWeight: 600 }}>Coupon Code *</label>
            <input type="text" placeholder="e.g. SUMMER20" value={newCode} onChange={e => setNewCode(e.target.value.toUpperCase())} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--color-outline)' }} />
          </div>
          <div style={{ flex: '0 0 120px' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.25rem', fontWeight: 600 }}>Discount Type</label>
            <select value={newType} onChange={e => setNewType(e.target.value as any)} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--color-outline)' }}>
              <option value="percentage">Percentage (%)</option>
              <option value="flat">Flat Amount (₹)</option>
            </select>
          </div>
          <div style={{ flex: '1 1 100px' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.25rem', fontWeight: 600 }}>Discount Value *</label>
            <input type="number" min="0" placeholder={newType === 'percentage' ? "20" : "500"} value={newValue} onChange={e => setNewValue(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--color-outline)' }} />
          </div>
          <div style={{ flex: '1 1 150px' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.25rem', fontWeight: 600 }}>Min Order Amt (₹)</label>
            <input type="number" min="0" placeholder="e.g. 1000" value={newMinOrder} onChange={e => setNewMinOrder(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--color-outline)' }} />
          </div>
          <button onClick={handleAdd} disabled={saving} className={styles.primaryBtn} style={{ padding: '0.5rem 1rem' }}>
            {saving ? "..." : "+ Add Coupon"}
          </button>
        </div>
      </div>

      <div className={`glass-panel ${styles.recentOrdersCard}`} style={{ marginTop: '2rem' }}>
        <h3 className={styles.panelTitle}>Active & Past Coupons</h3>
        {coupons.length === 0 ? (
          <p style={{ marginTop: '1rem', color: 'var(--color-text-secondary)' }}>No coupons created yet.</p>
        ) : (
          <div className={styles.tableWrapper} style={{ marginTop: '1rem' }}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Discount</th>
                  <th>Min Order</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {coupons.map((c, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 600, color: 'var(--color-primary)' }}>{c.code}</td>
                    <td>{c.type === 'percentage' ? `${c.value}% OFF` : `₹${c.value} OFF`}</td>
                    <td>{c.min_order > 0 ? `₹${c.min_order}` : 'None'}</td>
                    <td>
                      <span className={c.active ? styles.badgeActive : styles.badgePending}>
                        {c.active ? "Active" : "Disabled"}
                      </span>
                    </td>
                    <td>
                      <button onClick={() => toggleStatus(i)} className={styles.secondaryBtn} style={{ padding: '4px 8px', fontSize: '0.75rem', marginRight: '0.5rem' }}>
                        {c.active ? "Disable" : "Enable"}
                      </button>
                      <button onClick={() => handleDelete(i)} style={{ color: 'red', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
