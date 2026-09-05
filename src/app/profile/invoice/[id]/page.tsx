"use client";

import React, { useEffect, useState } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import type { OrderWithItems } from "@/lib/supabase/rows";
import { parseItemsSnapshot } from "@/lib/supabase/rows";
import { useAuth } from "@/context/AuthContext";

interface BillingAddress {
  name?: string | null;
  full_name?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  address?: string | null;
  apartment?: string | null;
  line1?: string | null;
  line2?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  zip?: string | null;
  country?: string | null;
  phone?: string | null;
  email?: string | null;
}

interface InvoiceItem {
  id?: string;
  title?: string | null;
  design_id?: string | null;
  product_id?: string | null;
  color?: string | null;
  size?: string | null;
  quantity: number;
  unit_price: number;
}

type ProductInfo = { id: string; title: string; image_url?: string; };
type DesignInfo = { id: string; image_url?: string; status?: string; };
type InvoiceOrderItem = NonNullable<OrderWithItems["order_items"]>[number];

export default function Invoice({ params }: { params: Promise<{ id: string }> }) {
  const [order, setOrder] = useState<OrderWithItems | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [id, setId] = useState<string>("");
  const [products, setProducts] = useState<Record<string, ProductInfo>>({});
  const [designs, setDesigns] = useState<Record<string, DesignInfo>>({});
  const { user, loading: authLoading } = useAuth();

  const inr = (n: number) => `₹${Number(n).toFixed(2)}`;

  useEffect(() => {
    async function resolveParams() {
      const resolved = await params;
      setId(resolved.id);
    }
    resolveParams();
  }, [params]);

  useEffect(() => {
    if (!id || authLoading) return;
    async function fetchOrder() {
      try {
        if (!user) throw new Error("Please sign in to view this invoice.");
        const token = await user.getIdToken();
        const headers = { Authorization: `Bearer ${token}` };
        const res = await fetch(`/api/orders/${id}`, { headers, cache: "no-store" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Order not found");
        setOrder(data.order);
        
        const orderData = data.order;
        const snapItems = parseItemsSnapshot(orderData.items_snapshot);
        const orderItems = (orderData.order_items || []) as InvoiceOrderItem[];
        
        const productIds = [...new Set(snapItems.map((i) => i.product_id).filter((productId): productId is string => Boolean(productId)))];
        const snapshotDesignIds = snapItems.map((i) => i.design_id).filter((designId): designId is string => Boolean(designId));
        const linkedDesignIds = orderItems.map((i) => i.custom_design_id).filter((designId): designId is string => Boolean(designId));
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
              const dRes = await fetch(`/api/designs/${did}`, { headers });
              if (dRes.ok) {
                const dData = await dRes.json();
                dMap[did as string] = dData.design || dData;
              }
            } catch { /* skip */ }
          }
          setDesigns(dMap);
        }
        
      } catch (err: unknown) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }
    fetchOrder();
  }, [id, user, authLoading]);

  if (loading) return <><Navbar/><main style={{padding: '6rem 2rem', textAlign: 'center'}}>Loading invoice...</main><Footer/></>;
  if (error || !order || (order.payment_status !== 'paid' && order.status !== 'delivered' && order.status !== 'shipped')) return <><Navbar/><main style={{padding: '6rem 2rem', textAlign: 'center'}}>{error || "Invoice not found"}</main><Footer/></>;

  const parsedAddress = normalizeBillingAddress(order.shipping_address);
    
  const address: BillingAddress = {
    full_name: stringValue(parsedAddress.full_name) || (stringValue(parsedAddress.firstName) ? `${stringValue(parsedAddress.firstName)} ${stringValue(parsedAddress.lastName) || ''}`.trim() : 'Guest Customer'),
    line1: stringValue(parsedAddress.line1) || stringValue(parsedAddress.address) || 'N/A',
    line2: stringValue(parsedAddress.line2) || stringValue(parsedAddress.apartment),
    city: stringValue(parsedAddress.city),
    state: stringValue(parsedAddress.state),
    postal_code: stringValue(parsedAddress.postal_code) || stringValue(parsedAddress.zip),
    country: stringValue(parsedAddress.country),
    phone: stringValue(parsedAddress.phone),
    email: stringValue(parsedAddress.email),
  };

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
              <h3 style={{ fontSize: "1rem", color: "var(--color-secondary)", margin: "0 0 0.5rem 0" }}>Billed To:</h3>
              <p style={{ fontWeight: 600, margin: "0 0 0.25rem 0" }}>{address.full_name || address.name}</p>
              <p style={{ color: "var(--color-on-surface-variant)", fontSize: "14px", margin: "0 0 0.25rem 0" }}>{address.line1}{address.line2 ? `, ${address.line2}` : ''}</p>
              <p style={{ color: "var(--color-on-surface-variant)", fontSize: "14px", margin: "0 0 0.25rem 0" }}>{address.city || 'N/A'}, {address.state || ''} {address.postal_code || ''}</p>
              <p style={{ color: "var(--color-on-surface-variant)", fontSize: "14px", margin: "0 0 0.25rem 0" }}>{address.country || 'India'}</p>
              {address.phone && <p style={{ color: "var(--color-on-surface-variant)", fontSize: "14px", margin: "0.25rem 0 0 0" }}>📞 {address.phone}</p>}
              <p style={{ color: "var(--color-secondary)", fontSize: "14px", marginTop: "0.5rem" }}>{address.email || order.users?.email || 'Guest Customer'}</p>
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
                {items.map((item, i) => {
                  const product = item.product_id ? products[item.product_id] : null;
                  const orderItem = order.order_items?.[i];
                  const did = item.design_id || orderItem?.custom_design_id;
                  const design = did ? designs[did as string] : null;

                  return (
                  <tr key={item.id || i} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <td style={{ padding: "1.5rem 0" }}>
                      <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                        {product?.image_url && (
                          <img src={product.image_url} alt="Product" style={{ width: "4rem", height: "4rem", objectFit: "cover", borderRadius: "4px" }} />
                        )}
                        <div>
                          <div style={{ fontWeight: 500 }}>{item.title || product?.title || "HIFI Custom Item"}</div>
                          {item.color && <div style={{ fontSize: "12px", color: "var(--color-secondary)", marginTop: "0.25rem" }}>{item.color}/{item.size}</div>}
                          
                          {design?.image_url && (
                            <div style={{ marginTop: "0.75rem", padding: "0.5rem", background: "rgba(255,255,255,0.03)", borderRadius: "4px" }}>
                              <div style={{ fontSize: "12px", color: "var(--color-primary)", marginBottom: "0.25rem", fontWeight: 600 }}>🎨 Custom Artwork</div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <img src={design.image_url} alt="Design" style={{ width: "3rem", height: "3rem", objectFit: "contain", borderRadius: "2px", background: "#000" }} />
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
                                    } catch {
                                      window.open(design.image_url, '_blank');
                                    }
                                  }}
                                  style={{ padding: "0.25rem 0.5rem", background: "var(--color-surface)", border: "1px solid var(--color-outline)", color: "var(--color-on-surface)", borderRadius: "4px", fontSize: "12px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "0.25rem" }}
                                >
                                  <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>download</span>
                                  Download
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "1.5rem 0", textAlign: "center", verticalAlign: "top" }}>{item.quantity}</td>
                    <td style={{ padding: "1.5rem 0", textAlign: "right", verticalAlign: "top" }}>{inr(Number(item.unit_price))}</td>
                    <td style={{ padding: "1.5rem 0", textAlign: "right", verticalAlign: "top" }}>{inr(Number(item.unit_price) * item.quantity)}</td>
                  </tr>
                  );
                })}
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
              Download / Print Bill
            </button>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

function normalizeBillingAddress(address: unknown): Record<string, unknown> {
  if (typeof address === "string") {
    try {
      const parsed = JSON.parse(address);
      return isRecord(parsed) ? parsed : {};
    } catch {
      return {};
    }
  }
  return isRecord(address) ? address : {};
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}
