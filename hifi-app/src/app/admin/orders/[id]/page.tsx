"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import styles from "./page.module.css";

const inr = (n: number) => `₹${Number(n).toFixed(2)}`;

const STATUS_OPTIONS = ["pending_payment", "paid", "processing", "shipped", "delivered", "cancelled", "refunded"];
const PAYMENT_OPTIONS = ["pending", "paid", "refunded", "failed"];

type SnapshotItem = {
  product_id?: string;
  title?: string;
  color?: string;
  size?: string;
  quantity?: number;
  unit_price?: number;
  variant_sku?: string;
  design_id?: string;
  variant_id?: string;
};

type Address = {
  full_name?: string;
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  phone?: string;
  country?: string;
  email?: string;
};

type Customer = {
  id?: string;
  full_name?: string;
  email?: string;
  phone?: string;
  role?: string;
};

type Order = {
  id: string;
  status: string;
  payment_status: string;
  total_amount: number;
  subtotal_amount?: number;
  shipping_fee?: number;
  delivery_fee?: number;
  created_at: string;
  updated_at?: string;
  user_id?: string;
  users?: Customer;
  shipping_address?: string | Address;
  items_snapshot?: SnapshotItem[];
  order_items?: Array<{ id: string; product_variant_id?: string; custom_design_id?: string; quantity: number; unit_price: number }>;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  payment_id?: string;
  currency?: string;
  delivery_mode?: string;
  notes?: string;
  invoices?: Array<{ id: string; invoice_number?: string }>;
};

type ProductInfo = {
  id: string;
  title: string;
  image_url?: string;
};

type DesignInfo = {
  id: string;
  image_url?: string;
  status?: string;
};

export default function AdminOrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ text: string; error?: boolean } | null>(null);
  const [products, setProducts] = useState<Record<string, ProductInfo>>({});
  const [designs, setDesigns] = useState<Record<string, DesignInfo>>({});
  const [orderId, setOrderId] = useState<string>("");

  useEffect(() => {
    (async () => {
      const p = await params;
      setOrderId(p.id);
    })();
  }, [params]);

  useEffect(() => {
    if (!orderId) return;
    fetchOrder();
  }, [orderId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function fetchOrder() {
    try {
      setLoading(true);
      const res = await fetch(`/api/orders/${orderId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch order");
      setOrder(data.order);

      // Fetch product images
      const items = (data.order.items_snapshot as SnapshotItem[]) || [];
      const orderItems = data.order.order_items || [];
      const productIds = [...new Set(items.map(i => i.product_id).filter(Boolean))];
      
      // Designs might be in snapshot or linked via order_items
      const snapshotDesignIds = items.map(i => i.design_id).filter(Boolean);
      const linkedDesignIds = orderItems.map((i: any) => i.custom_design_id).filter(Boolean);
      const designIds = [...new Set([...snapshotDesignIds, ...linkedDesignIds])];

      if (productIds.length > 0) {
        const pRes = await fetch(`/api/products?ids=${productIds.join(",")}`);
        if (pRes.ok) {
          const pData = await pRes.json();
          const map: Record<string, ProductInfo> = {};
          (pData.products || []).forEach((p: ProductInfo) => { map[p.id] = p; });
          setProducts(map);
        }
      }

      if (designIds.length > 0) {
        const dMap: Record<string, DesignInfo> = {};
        for (const did of designIds) {
          try {
            const dRes = await fetch(`/api/designs/${did}`);
            if (dRes.ok) {
              const dData = await dRes.json();
              dMap[did as string] = dData.design || dData;
            }
          } catch { /* skip */ }
        }
        setDesigns(dMap);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  async function updateOrder(patch: { status?: string; payment_status?: string }) {
    if (!order) return;
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");
      setOrder(prev => prev ? { ...prev, ...data.order } : prev);
      setMsg({ text: "Order updated successfully" });
    } catch (err: unknown) {
      setMsg({ text: err instanceof Error ? err.message : String(err), error: true });
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p>Loading order...</p>;
  if (error) return <p style={{ color: "var(--color-error)" }}>{error}</p>;
  if (!order) return <p>Order not found</p>;

  const address = parseAddress(order.shipping_address);
  const items = order.items_snapshot || [];
  const customer = order.users;

  const statusBadgeClass = (s: string) => {
    if (s === "paid" || s === "delivered") return styles.badgePaid;
    if (s === "cancelled" || s === "refunded") return styles.badgeCancelled;
    if (s === "shipped") return styles.badgeShipped;
    if (s === "processing") return styles.badgeProcessing;
    return styles.badgePending;
  };

  return (
    <div className={styles.container}>
      <Link href="/admin/orders" className={styles.backLink}>
        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_back</span>
        Back to Orders
      </Link>

      {/* Header */}
      <div className={styles.header}>
        <div>
          <div className={styles.orderId}>#{order.id.slice(0, 8).toUpperCase()}</div>
          <div className={styles.date}>
            Placed {new Date(order.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
          </div>
        </div>
        <div className={styles.badges}>
          <span className={`${styles.badge} ${statusBadgeClass(order.status)}`}>{order.status}</span>
          <span className={`${styles.badge} ${statusBadgeClass(order.payment_status)}`}>{order.payment_status}</span>
        </div>
      </div>

      {/* Customer Info */}
      <div className={`glass-panel ${styles.section}`}>
        <div className={styles.sectionTitle}>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>person</span>
          Customer
        </div>
        <div className={styles.customerGrid}>
          <div>
            <div className={styles.infoLabel}>Name</div>
            <div className={styles.infoValue}>{customer?.full_name || address.full_name || "Guest"}</div>
          </div>
          <div>
            <div className={styles.infoLabel}>Email</div>
            <div className={styles.infoValue}>{customer?.email || address.email || "—"}</div>
          </div>
          <div>
            <div className={styles.infoLabel}>Phone</div>
            <div className={styles.infoValue}>{customer?.phone || address.phone || "—"}</div>
          </div>
          <div>
            <div className={styles.infoLabel}>User ID</div>
            <div className={styles.infoValue} style={{ fontFamily: "monospace", fontSize: 12 }}>{order.user_id || "—"}</div>
          </div>
        </div>
      </div>

      {/* Items with Images */}
      <div className={`glass-panel ${styles.section}`}>
        <div className={styles.sectionTitle}>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>shopping_bag</span>
          Items ({items.length})
        </div>
        {items.map((item, i) => {
          const product = item.product_id ? products[item.product_id] : null;
          
          // Match design ID (it might be on the snapshot or the corresponding order_item)
          const orderItem = order.order_items?.[i];
          const did = item.design_id || orderItem?.custom_design_id;
          const design = did ? designs[did as string] : null;
          
          const imageUrl = product?.image_url;

          return (
            <div key={i}>
              <div className={styles.itemCard}>
                {imageUrl ? (
                  <img src={imageUrl} alt={item.title || "Product"} className={styles.itemImage} />
                ) : (
                  <div className={styles.noImage}>No img</div>
                )}
                <div>
                  <div className={styles.itemTitle}>{item.title || product?.title || "HIFI Custom Item"}</div>
                  <div className={styles.itemMeta}>
                    {item.color && <>{item.color} / {item.size}</>}
                    {item.variant_sku && <> · SKU: {item.variant_sku}</>}
                    {' '}· Qty: {item.quantity}
                  </div>
                  {item.design_id && (
                    <div className={styles.itemMeta} style={{ color: "var(--color-primary)" }}>
                      🎨 Custom Design Attached
                    </div>
                  )}
                </div>
                <div className={styles.itemPrice}>
                  {inr(Number(item.unit_price || 0) * (item.quantity || 1))}
                  {(item.quantity || 1) > 1 && (
                    <div className={styles.itemMeta}>@ {inr(Number(item.unit_price || 0))}/ea</div>
                  )}
                </div>
              </div>

              {/* Design Image */}
              {design?.image_url && (
                <div className={styles.designSection}>
                  <div className={styles.designLabel}>
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>palette</span>
                    Custom Design
                    {design.status && <span> — {design.status}</span>}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginTop: "0.5rem" }}>
                    <a href={design.image_url} target="_blank" rel="noopener noreferrer">
                      <img src={design.image_url} alt="Custom Design" className={styles.designImage} />
                    </a>
                    <button 
                      onClick={async () => {
                        try {
                          const r = await fetch(design.image_url!);
                          const blob = await r.blob();
                          const url = window.URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `design_${order.id.slice(0,8)}.jpg`;
                          document.body.appendChild(a);
                          a.click();
                          a.remove();
                          window.URL.revokeObjectURL(url);
                        } catch (err) {
                          window.open(design.image_url, '_blank');
                        }
                      }}
                      style={{ padding: "0.5rem 1rem", background: "var(--color-primary)", color: "#000", borderRadius: "4px", border: "none", cursor: "pointer", fontSize: "14px", fontWeight: "bold", display: "flex", alignItems: "center", gap: "0.5rem" }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>download</span>
                      Download Design
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Shipping + Totals side by side */}
      <div className={styles.twoCol}>
        {/* Shipping Address */}
        <div className={`glass-panel ${styles.section}`}>
          <div className={styles.sectionTitle}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>local_shipping</span>
            Shipping Address
          </div>
          <div className={styles.addressText}>
            {address.full_name && <strong>{address.full_name}</strong>}
            {address.full_name && <br />}
            {address.line1}
            {address.line2 && <>, {address.line2}</>}
            <br />
            {address.city}{address.state ? `, ${address.state}` : ""} {address.postal_code}
            <br />
            {address.country || "India"}
            {address.phone && <><br />📞 {address.phone}</>}
          </div>
        </div>

        {/* Order Totals */}
        <div className={`glass-panel ${styles.section}`}>
          <div className={styles.sectionTitle}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>receipt_long</span>
            Order Totals
          </div>
          <div className={styles.totalsGrid}>
            <div className={styles.totalRow}>
              <span>Subtotal</span>
              <span>{inr(order.subtotal_amount != null ? Number(order.subtotal_amount) : Number(order.total_amount) - Number(order.shipping_fee || order.delivery_fee || 0))}</span>
            </div>
            <div className={styles.totalRow}>
              <span>Shipping ({order.delivery_mode || "global"})</span>
              <span>{inr(Number(order.shipping_fee || order.delivery_fee || 0))}</span>
            </div>
            <div className={styles.totalRowFinal}>
              <span>Total</span>
              <span>{inr(Number(order.total_amount))}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Details */}
      <div className={`glass-panel ${styles.section}`}>
        <div className={styles.sectionTitle}>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>credit_card</span>
          Payment Details
        </div>
        <div className={styles.paymentGrid}>
          <div>
            <div className={styles.infoLabel}>Razorpay Order ID</div>
            <div className={styles.infoValue} style={{ fontFamily: "monospace", fontSize: 12 }}>{order.razorpay_order_id || "—"}</div>
          </div>
          <div>
            <div className={styles.infoLabel}>Payment ID</div>
            <div className={styles.infoValue} style={{ fontFamily: "monospace", fontSize: 12 }}>{order.razorpay_payment_id || order.payment_id || "—"}</div>
          </div>
          <div>
            <div className={styles.infoLabel}>Currency</div>
            <div className={styles.infoValue}>{order.currency || "INR"}</div>
          </div>
          <div>
            <div className={styles.infoLabel}>Invoice</div>
            <div className={styles.infoValue}>
              {order.invoices && order.invoices.length > 0 ? (
                <Link href={`/profile/invoice/${order.id}`} style={{ color: "var(--color-primary)" }}>
                  {order.invoices[0].invoice_number || "View Invoice"}
                </Link>
              ) : "—"}
            </div>
          </div>
        </div>
      </div>

      {/* Status Update Controls */}
      <div className={`glass-panel ${styles.section}`}>
        <div className={styles.sectionTitle}>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>tune</span>
          Update Order
        </div>
        <div className={styles.controls}>
          <div className={styles.controlGroup}>
            <span className={styles.controlLabel}>Order Status</span>
            <select
              className={styles.controlSelect}
              value={order.status}
              onChange={e => updateOrder({ status: e.target.value })}
              disabled={saving}
            >
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className={styles.controlGroup}>
            <span className={styles.controlLabel}>Payment Status</span>
            <select
              className={styles.controlSelect}
              value={order.payment_status}
              onChange={e => updateOrder({ payment_status: e.target.value })}
              disabled={saving}
            >
              {PAYMENT_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className={styles.controlGroup}>
            <span className={styles.controlLabel}>Invoice</span>
            <Link href={`/profile/invoice/${order.id}`} className={styles.saveBtn} style={{ textDecoration: "none", textAlign: "center" }}>
              Download Bill
            </Link>
          </div>
        </div>
        {msg && (
          <p className={`${styles.msg} ${msg.error ? styles.msgErr : styles.msgOk}`}>
            {msg.text}
          </p>
        )}
      </div>
    </div>
  );
}

function parseAddress(a: unknown): Address {
  if (!a) return {};
  let parsed = typeof a === "string" ? (function(){ try{ return JSON.parse(a); }catch{ return {}; }})() : a as any;
  
  // Handle new checkout format mapped to Address type
  return {
    full_name: parsed.full_name || (parsed.firstName ? `${parsed.firstName} ${parsed.lastName || ''}`.trim() : undefined),
    line1: parsed.line1 || parsed.address,
    line2: parsed.line2 || parsed.apartment,
    city: parsed.city,
    state: parsed.state,
    postal_code: parsed.postal_code || parsed.zip,
    phone: parsed.phone,
    country: parsed.country || "India",
    email: parsed.email
  };
}
