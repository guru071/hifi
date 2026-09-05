"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import styles from "./page.module.css";
import { useAuth } from "@/context/AuthContext";
import type { OrderWithItems } from "@/lib/supabase/rows";
import { parseItemsSnapshot } from "@/lib/supabase/rows";

const inr = (n: number) => `₹${Number(n).toFixed(2)}`;

interface OrderItemView {
  id: string;
  title?: string | null;
  quantity: number;
  unit_price: number;
  color?: string | null;
  size?: string | null;
  design_id?: string | null;
}

export default function Orders() {
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    async function fetchOrders() {
      try {
        const token = user ? await user.getIdToken() : null;
        const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
        
        const res = await fetch("/api/orders", { 
          headers,
          cache: "no-store" 
        });
        if (res.ok) {
          const data = await res.json();
          const validOrders = (data.orders || []).filter((o: any) => o.payment_status === 'paid' || o.status === 'delivered' || o.status === 'shipped');
          setOrders(validOrders);
        }
      } catch (err) {
        console.error("Failed to fetch orders:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();
  }, [authLoading, user, router]);

  return (
    <>
      <Navbar />
      <main className={styles.main}>
        <div className={styles.header}>
          <Link href="/profile" className={styles.backLink}>
            <span className="material-symbols-outlined">arrow_back</span> Back to Account
          </Link>
          <h1 className={styles.title}>My Orders</h1>
          <p className={styles.subtitle}>Track, review, and download invoices for your orders.</p>
        </div>

        {loading && <p>Loading orders...</p>}
        {!loading && orders.length === 0 && (
          <div className={`glass-panel ${styles.emptyCard}`}>
            <p>You have no orders yet.</p>
            <Link href="/shop" style={{ color: "var(--color-primary)" }}>Start shopping</Link>
          </div>
        )}

        {!loading && orders.map(order => (
          <div key={order.id} className={`glass-panel ${styles.orderCard}`}>
            <div className={styles.orderHeader}>
              <div>
                <div className={styles.orderId}>#{order.id.slice(0, 8).toUpperCase()}</div>
                <div className={styles.orderDate}>Placed on {new Date(order.created_at as string).toLocaleDateString()}</div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <div className={`${styles.orderStatus} ${order.status === 'delivered' ? styles.statusPaid : styles.statusPending}`}>
                  {order.status === 'paid' ? 'paid' : order.status}
                </div>
              </div>
            </div>
            <div className={styles.orderBody}>
              {(parseItemsSnapshot(order.items_snapshot).length
                ? (parseItemsSnapshot(order.items_snapshot) as unknown as OrderItemView[]).map((snap, i: number) => ({
                    id: `${order.id}-${i}`, title: snap.title, quantity: snap.quantity, unit_price: snap.unit_price, color: snap.color, size: snap.size, design_id: snap.design_id,
                  })) as OrderItemView[]
                : ((order.order_items || []) as OrderItemView[])
              ).map((item) => (
                <div key={item.id} className={styles.orderItem}>
                  <div className={styles.itemDetails}>
                    <div className={styles.itemTitle}>{item.title || "HIFI Custom Item"}</div>
                    <div className={styles.itemVariant}>
                      Qty: {item.quantity}
                      {item.color && <> · {item.color}/{item.size}</>}
                      {item.design_id && <span style={{ color: "var(--color-primary)" }}> · Custom Artwork</span>}
                    </div>
                  </div>
                  <div className={styles.itemPrice}>{inr(Number(item.unit_price) * item.quantity)}</div>
                </div>
              ))}
            </div>
            <div className={styles.orderFooter}>
              <div>Total: <span className={styles.orderTotal}>{inr(Number(order.total_amount))}</span></div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <Link href={`/order/${order.id}`} className={styles.btnTrack} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)' }}>View Details</Link>
                <Link href={`/profile/invoice/${order.id}`} className={styles.btnTrack}>Invoice</Link>
              </div>
            </div>
          </div>
        ))}
      </main>
      <Footer />
    </>
  );
}