"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import styles from "./page.module.css";

const inr = (n: number) => `₹${Number(n).toFixed(2)}`;

const STATUS_FILTERS = ["all", "pending_payment", "paid", "processing", "shipped", "delivered", "cancelled", "refunded"];
const STATUS_OPTIONS = ["pending_payment", "paid", "processing", "shipped", "delivered", "cancelled", "refunded"];
const PAYMENT_OPTIONS = ["pending", "paid", "refunded", "failed"];

type OrderItem = {
  id: string;
  title?: string;
  color?: string;
  size?: string;
  quantity: number;
  unit_price: number | string;
  design_id?: string;
  [key: string]: unknown;
};

type OrderAddress = {
  full_name?: string;
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  phone?: string;
  country?: string;
  [key: string]: unknown;
};

type AdminOrder = {
  id: string;
  status: string;
  payment_status: string;
  total_amount: number | string;
  created_at: string;
  user_id?: string;
  users?: {
    full_name?: string;
    email?: string;
  };
  shipping_address?: string | OrderAddress;
  items_snapshot?: OrderItem[];
  order_items?: OrderItem[];
  shipping_fee?: number | string;
  subtotal_amount?: number | string;
  notes?: string;
  razorpay_order_id?: string;
  [key: string]: unknown;
};

function DesignPreview({ designId }: { designId: string }) {
  const [design, setDesign] = useState<{ image_url?: string } | null>(null);
  
  useEffect(() => {
    fetch(`/api/designs/${designId}`).then(r => r.json()).then(d => setDesign(d.design || d)).catch(() => {});
  }, [designId]);

  if (!design?.image_url) return null;

  return (
    <div style={{ marginTop: "0.5rem", padding: "0.5rem", background: "rgba(255,255,255,0.05)", borderRadius: "8px", display: "flex", gap: "1rem", alignItems: "center" }}>
      <img src={design.image_url} alt="Design" style={{ width: "60px", height: "60px", objectFit: "cover", borderRadius: "4px" }} />
      <a href={design.image_url} download="design.jpg" target="_blank" rel="noopener noreferrer" style={{ padding: "0.5rem 1rem", background: "var(--color-primary)", color: "#000", borderRadius: "4px", textDecoration: "none", fontSize: "14px", fontWeight: "bold" }}>
        <span className="material-symbols-outlined" style={{ fontSize: "16px", verticalAlign: "middle", marginRight: "4px" }}>download</span>
        Download Design
      </a>
    </div>
  );
}

export default function AdminOrders() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ id: string; text: string; error?: boolean } | null>(null);

  async function fetchOrders() {
    try {
      setLoading(true);
      const res = await fetch("/api/orders", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch orders");
      setOrders(data.orders || []);
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const initFetch = async () => {
      await fetchOrders();
    };
    initFetch();
  }, []);

  async function updateOrder(orderId: string, patch: { status?: string; payment_status?: string }) {
    setSaving(orderId);
    setMsg(null);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, ...data.order } : o));
      setMsg({ id: orderId, text: "Order updated" });
    } catch (err: unknown) {
      setMsg({ id: orderId, text: err instanceof Error ? err.message : String(err), error: true });
    } finally {
      setSaving(null);
    }
  }

  const filtered = statusFilter === "all" 
    ? orders.filter(o => o.payment_status === "paid" || o.status === "delivered" || o.status === "shipped") 
    : orders.filter(o => o.status === statusFilter);
  const parseAddress = (a: unknown): OrderAddress => typeof a === 'string' ? (() => { try { return JSON.parse(a); } catch { return {}; } })() : (a || {}) as OrderAddress;

  return (
    <>
      <header className={styles.header}>
        <div>
          <h2 className={styles.title}>Orders</h2>
          <p className={styles.subtitle}>Manage fulfillment, status, and payments.</p>
        </div>
      </header>

      <div className={styles.filterRow}>
        {STATUS_FILTERS.map(sf => (
          <button
            key={sf}
            className={`${styles.filterChip} ${statusFilter === sf ? styles.filterChipActive : ""}`}
            onClick={() => setStatusFilter(sf)}
          >
            {sf === "all" ? `All (${orders.length})` : `${sf} (${orders.filter(o => o.status === sf).length})`}
          </button>
        ))}
      </div>

      {error && <p style={{ color: "var(--color-error)" }}>{error}</p>}
      {loading && <p>Loading orders...</p>}
      {!loading && filtered.length === 0 && <p>No orders in this filter.</p>}

      {!loading && filtered.map(order => {
        const address = parseAddress(order.shipping_address);
        const items = order.items_snapshot?.length ? order.items_snapshot : order.order_items || [];
        return (
          <div key={order.id} className={`glass-panel ${styles.orderCard}`}>
            <button className={styles.orderRow} onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}>
              <div className={styles.orderId}>#{order.id.slice(0, 8).toUpperCase()}</div>
              <div className={styles.cell}>
                <div className={styles.name}>{order.users?.full_name || "Guest"}</div>
                <div className={styles.sub}>{order.users?.email || order.user_id?.slice(0, 8) || "—"}</div>
              </div>
              <div className={styles.cell}>
                <div className={styles.sub}>{new Date(order.created_at).toLocaleDateString()}</div>
              </div>
              <div className={styles.cell}>{items.length} item{items.length !== 1 ? "s" : ""}</div>
              <div className={styles.cell}><strong>{inr(Number(order.total_amount))}</strong></div>
              <div className={`${styles.badge} ${order.payment_status === 'paid' ? styles.badgePaid : styles.badgePending}`}>{order.payment_status}</div>
              <div className={`${styles.badge} ${order.status === 'delivered' ? styles.badgePaid : order.status === 'cancelled' ? styles.badgeCancelled : styles.badgePending}`}>{order.status}</div>
              <span className={`material-symbols-outlined ${expandedId === order.id ? styles.rotated : ""}`}>expand_more</span>
            </button>

            {expandedId === order.id && (
              <div className={styles.orderDetail}>
                <div style={{ marginBottom: "1rem" }}>
                  <h4 style={{ marginBottom: "0.5rem" }}>Items</h4>
                  {items.map((item: OrderItem, i: number) => (
                    <div key={item.id || i} style={{ marginBottom: "1rem" }}>
                      <div className={styles.itemRow}>
                        <span>{item.title || "HIFI Custom Item"}</span>
                        <span className={styles.sub}>
                          {item.color && <>{item.color}/{item.size} · </>}Qty {item.quantity}
                          {item.design_id && <span style={{ color: "var(--color-primary)" }}> · Custom</span>}
                        </span>
                        <span>{inr(Number(item.unit_price) * item.quantity)}</span>
                      </div>
                      {item.design_id && <DesignPreview designId={item.design_id} />}
                    </div>
                  ))}
                </div>

                <div className={styles.detailGrid}>
                  <div>
                    <h4 style={{ marginBottom: "0.5rem" }}>Ship To</h4>
                    <p className={styles.sub} style={{ lineHeight: "1.7" }}>
                      {address.full_name}<br />
                      {address.line1}{address.line2 ? <>, {address.line2}</> : null}<br />
                      {address.city}{address.state ? `, ${address.state}` : null} {address.postal_code}<br />
                      {address.country}{address.phone ? <><br />Phone: {address.phone}</> : null}
                    </p>
                  </div>
                  <div>
                    <h4 style={{ marginBottom: "0.5rem" }}>Totals</h4>
                    <div className={styles.sub}>Subtotal: {inr(order.subtotal_amount ? Number(order.subtotal_amount) : Number(order.total_amount) - Number(order.shipping_fee || 0))}</div>
                    <div className={styles.sub}>Shipping: {inr(Number(order.shipping_fee ?? order.delivery_fee ?? 0))}</div>
                    <div style={{ marginTop: "0.25rem", fontWeight: 700 }}>Total: {inr(Number(order.total_amount))}</div>
                    {order.razorpay_order_id && <div className={styles.sub} style={{ marginTop: "0.5rem" }}>Razorpay: {order.razorpay_order_id}</div>}
                  </div>
                </div>

                <div className={styles.updateRow}>
                  <label className={styles.label}>
                    Status
                    <select
                      className={styles.select}
                      value={order.status}
                      onChange={e => updateOrder(order.id, { status: e.target.value })}
                      disabled={saving === order.id}
                    >
                      {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </label>
                  <label className={styles.label}>
                    Payment
                    <select
                      className={styles.select}
                      value={order.payment_status}
                      onChange={e => updateOrder(order.id, { payment_status: e.target.value })}
                      disabled={saving === order.id}
                    >
                      {PAYMENT_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </label>
                  <Link href={`/profile/invoice/${order.id}`} className={styles.invoiceLink}>Download Bill</Link>
                </div>

                {msg?.id === order.id && (
                  <p style={{ color: msg?.error ? "var(--color-error)" : "var(--color-primary)", fontSize: 13, marginTop: "0.5rem" }}>{msg!.text}</p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}