"use client";

import React, { useEffect, useState } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import type { OrderWithItems } from "@/lib/supabase/rows";
import { parseItemsSnapshot } from "@/lib/supabase/rows";

interface BillingAddress {
  name?: string | null;
  full_name?: string | null;
  city?: string | null;
}

interface InvoiceItem {
  id?: string;
  title?: string | null;
  design_id?: string | null;
  color?: string | null;
  size?: string | null;
  quantity: number;
  unit_price: number;
}

export default function Invoice({ params }: { params: Promise<{ id: string }> }) {
  const [order, setOrder] = useState<OrderWithItems | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [id, setId] = useState<string>("");

  const inr = (n: number) => `₹${Number(n).toFixed(2)}`;

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
      } catch (err: unknown) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }
    fetchOrder();
  }, [id]);

  if (loading) return <><Navbar/><main style={{padding: '6rem 2rem', textAlign: 'center'}}>Loading invoice...</main><Footer/></>;
  if (error || !order) return <><Navbar/><main style={{padding: '6rem 2rem', textAlign: 'center'}}>{error || "Invoice not found"}</main><Footer/></>;

  const address: BillingAddress =
    typeof order.shipping_address === 'string'
      ? (JSON.parse(order.shipping_address) as BillingAddress)
      : (order.shipping_address as BillingAddress | null) ?? { name: 'Customer', city: 'N/A' };

  const items: InvoiceItem[] = parseItemsSnapshot(order.items_snapshot).length
    ? (parseItemsSnapshot(order.items_snapshot) as InvoiceItem[])
    : ((order.order_items || []) as InvoiceItem[]);

  return (
    <>
      <Navbar />
      <main style={{ padding: "6rem 2rem", maxWidth: "800px", margin: "0 auto", minHeight: "80vh" }}>
        <div className="glass-panel" style={{ padding: "3rem", borderRadius: "var(--radius-lg)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "3rem", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "2rem" }}>
            <div>
              <h1 style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>INVOICE</h1>
              <p style={{ color: "var(--color-secondary)", fontSize: "14px" }}>Order #{order.id.split('-')[0].toUpperCase()}</p>
              <p style={{ color: "var(--color-secondary)", fontSize: "14px" }}>Date: {new Date(order.created_at as string).toLocaleDateString()}</p>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontWeight: 600, fontSize: "1.2rem", marginBottom: "0.5rem" }}>HIFI Customs</div>
              <p style={{ color: "var(--color-secondary)", fontSize: "14px", lineHeight: "1.5" }}>
                hificustoms.com<br/>
                billing@hificustoms.com
              </p>
            </div>
          </div>
          
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3rem" }}>
            <div>
              <h3 style={{ fontSize: "1rem", color: "var(--color-secondary)", marginBottom: "0.5rem" }}>Billed To:</h3>
              <p style={{ fontWeight: 500 }}>{address.name}</p>
              <p style={{ color: "var(--color-secondary)", fontSize: "14px" }}>{address.city}</p>
              <p style={{ color: "var(--color-secondary)", fontSize: "14px" }}>{order.users?.email || 'Guest Customer'}</p>
            </div>
            <div style={{ textAlign: "right" }}>
              <h3 style={{ fontSize: "1rem", color: "var(--color-secondary)", marginBottom: "0.5rem" }}>Payment Status:</h3>
              <span style={{ 
                display: "inline-block", 
                padding: "0.25rem 0.75rem", 
                borderRadius: "1rem", 
                backgroundColor: order.payment_status === 'paid' ? "rgba(0, 255, 128, 0.1)" : "rgba(255, 170, 0, 0.1)", 
                color: order.payment_status === 'paid' ? "#00ff80" : "#ffaa00",
                fontSize: "12px",
                fontWeight: 600,
                textTransform: "uppercase"
              }}>{order.payment_status === 'paid' ? 'PAID' : order.payment_status || 'PENDING'}</span>
            </div>
          </div>

          <div style={{ marginBottom: "2rem" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)", textAlign: "left" }}>
                  <th style={{ padding: "1rem 0", color: "var(--color-secondary)", fontWeight: 500 }}>Description</th>
                  <th style={{ padding: "1rem 0", color: "var(--color-secondary)", fontWeight: 500, textAlign: "center" }}>Qty</th>
                  <th style={{ padding: "1rem 0", color: "var(--color-secondary)", fontWeight: 500, textAlign: "right" }}>Unit Price</th>
                  <th style={{ padding: "1rem 0", color: "var(--color-secondary)", fontWeight: 500, textAlign: "right" }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={item.id || i} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <td style={{ padding: "1rem 0" }}>
                      <div style={{ fontWeight: 500 }}>{item.title || "HIFI Custom Item"}</div>
                      {item.design_id && <div style={{ fontSize: "12px", color: "var(--color-primary)" }}>+ Custom Artwork</div>}
                      {item.color && <div style={{ fontSize: "12px", color: "var(--color-secondary)" }}>{item.color}/{item.size}</div>}
                    </td>
                    <td style={{ padding: "1rem 0", textAlign: "center" }}>{item.quantity}</td>
                    <td style={{ padding: "1rem 0", textAlign: "right" }}>{inr(Number(item.unit_price))}</td>
                    <td style={{ padding: "1rem 0", textAlign: "right" }}>{inr(Number(item.unit_price) * item.quantity)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ width: "300px", marginLeft: "auto", borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
              <span style={{ color: "var(--color-secondary)" }}>Subtotal</span>
              <span>{inr(Number(order.subtotal_amount ?? order.total_amount - order.shipping_fee))}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
              <span style={{ color: "var(--color-secondary)" }}>Shipping</span>
              <span>{inr(Number(order.shipping_fee ?? order.delivery_fee ?? 0))}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "1.2rem", fontWeight: 700, paddingTop: "1rem", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
              <span>Total Paid</span>
              <span>{inr(Number(order.total_amount))}</span>
            </div>
          </div>
          
          <div style={{ textAlign: "center", marginTop: "4rem" }}>
            <button 
              onClick={() => window.print()}
              style={{
                background: "var(--color-surface)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "var(--color-on-surface)",
                padding: "0.75rem 1.5rem",
                borderRadius: "var(--radius-full)",
                cursor: "pointer",
                fontWeight: 600,
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem"
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>print</span>
              Print Invoice
            </button>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
