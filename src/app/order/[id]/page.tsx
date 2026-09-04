"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import type { ItemSnapshot, OrderWithUsers } from "@/lib/supabase/rows";
import { parseItemsSnapshot, parseShippingAddress } from "@/lib/supabase/rows";

const inr = (n: number) => `₹${Number(n).toFixed(2)}`;

type OrderLineItem = ItemSnapshot & { id?: string | null; design_id?: string | null };

const statusSteps = ["pending", "pending_payment", "paid", "processing", "shipped", "delivered"];
const statusLabels: Record<string, string> = {
  pending_payment: "Awaiting payment",
  pending: "Order received",
  paid: "Paid",
  processing: "In production",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

export default function OrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const [order, setOrder] = useState<OrderWithUsers | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [id, setId] = useState<string>("");

  useEffect(() => {
    async function resolveParams() {
      const resolved = await params;
      setId(resolved.id);
    }
    resolveParams();
  }, [params]);

  useEffect(() => {
    if (!id) return;
    async function fetchOrder() {
      try {
        const res = await fetch(`/api/orders/${id}`, { cache: "no-store" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Order not found");
        setOrder(data.order);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }
    fetchOrder();
  }, [id]);

  if (loading) return <><Navbar/><main style={{padding: '6rem 2rem', textAlign: 'center'}}>Loading order...</main><Footer/></>;
  if (error || !order) return <><Navbar/><main style={{padding: '6rem 2rem', textAlign: 'center'}}>{error || "Order not found"}</main><Footer/></>;

  const items = parseItemsSnapshot(order.items_snapshot) as unknown as OrderLineItem[];
  const address = parseShippingAddress(order.shipping_address) ?? {};
  const currentStepIndex = statusSteps.indexOf(order.status as string);
  const isActive = order.status !== 'cancelled' && order.status !== 'refunded';

  return (
    <>
      <Navbar />
      <main style={{ padding: "6rem 2rem", maxWidth: "900px", margin: "0 auto", minHeight: "80vh" }}>
        <div style={{ marginBottom: "2rem" }}>
          <h1 style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>Order #{order.id.slice(0, 8).toUpperCase()}</h1>
          <p style={{ color: "var(--color-secondary)" }}>
            Placed on {new Date(order.created_at as string).toLocaleDateString()} · {statusLabels[order.status as string] || order.status}
          </p>
        </div>

        {/* Status stepper */}
        {isActive && (
          <div className="glass-panel" style={{ padding: "2rem", borderRadius: "var(--radius-lg)", marginBottom: "2rem", display: "flex", justifyContent: "space-between" }}>
            {statusSteps.map((s, i) => (
              <div key={s} style={{ display: "flex", alignItems: "center", gap: "0.5rem", flex: 1 }}>
                <div style={{
                  width: "32px", height: "32px", borderRadius: "50%",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  backgroundColor: i <= currentStepIndex ? "var(--color-primary, #0061a4)" : "var(--color-surface-container-highest)",
                  color: i <= currentStepIndex ? "#fff" : "var(--color-on-surface-variant)",
                  fontWeight: 600, fontSize: "14px", flexShrink: 0,
                }}>
                  {i < currentStepIndex ? <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>check</span> : i + 1}
                </div>
                <div style={{ fontSize: "13px", fontWeight: i <= currentStepIndex ? 600 : 500, color: i <= currentStepIndex ? "#fff" : "var(--color-on-surface-variant)", whiteSpace: "nowrap" }}>
                  {statusLabels[s]}
                </div>
                {i < statusSteps.length - 1 && (
                  <div style={{ flex: 1, height: "2px", backgroundColor: i < currentStepIndex ? "var(--color-primary, #0061a4)" : "var(--color-surface-container-highest)", margin: "0 0.5rem" }} />
                )}
              </div>
            ))}
          </div>
        )}

        <div className="glass-panel" style={{ padding: "2rem", borderRadius: "var(--radius-lg)", marginBottom: "2rem" }}>
          <h3 style={{ marginBottom: "1rem" }}>Items</h3>
          {items.map((item, i) => (
            <div key={item.id || i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <div>
                <div style={{ fontWeight: 500 }}>{item.title || "HIFI Custom Item"}</div>
                <div style={{ fontSize: "13px", color: "var(--color-on-surface-variant)" }}>
                  Qty {item.quantity} × {inr(Number(item.unit_price))}
                  {item.color && <> · {item.color}/{item.size}</>}
                  {item.design_id && <span style={{ color: "var(--color-primary)" }}> · Custom Artwork</span>}
                </div>
              </div>
              <div style={{ fontWeight: 600 }}>{inr(Number(item.unit_price) * item.quantity)}</div>
            </div>
          ))}

          <div style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "0.5rem", alignItems: "flex-end" }}>
            <div style={{ display: "flex", justifyContent: "space-between", width: "260px" }}>
              <span style={{ color: "var(--color-on-surface-variant)" }}>Subtotal</span>
              <span>{inr(Number(order.subtotal_amount ?? (order.total_amount - order.shipping_fee)))}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", width: "260px" }}>
              <span style={{ color: "var(--color-on-surface-variant)" }}>Shipping</span>
              <span>{inr(Number(order.shipping_fee ?? order.delivery_fee ?? 0))}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", width: "260px", fontSize: "1.2rem", fontWeight: 700, borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "0.75rem" }}>
              <span>Total</span>
              <span>{inr(Number(order.total_amount))}</span>
            </div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: "2rem", borderRadius: "var(--radius-lg)" }}>
          <h3 style={{ marginBottom: "1rem" }}>Shipping Address</h3>
          <p style={{ color: "var(--color-on-surface-variant)", lineHeight: "1.7", fontSize: "14px" }}>
            {address.full_name}<br />
            {address.line1}{address.line2 ? <>, {address.line2}</> : null}<br />
            {address.city}
            {address.state ? `, ${address.state}` : null} {address.postal_code}<br />
            {address.country}<br />
            {address.phone && <>Phone: {address.phone}<br /></>}
          </p>
          <div style={{ marginTop: "1.5rem", display: "flex", gap: "0.75rem" }}>
            <Link href={`/profile/invoice/${order.id}`} style={{ color: "#fff", background: "var(--color-primary)", padding: "0.5rem 1rem", borderRadius: "8px", textDecoration: "none", fontSize: "14px", fontWeight: "bold" }}>Download Bill</Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}