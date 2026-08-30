"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
  custom?: boolean;
  custom_design_id?: string | null;
  design_id?: string | null;
  color?: string | null;
  size?: string | null;
}

export default function Profile() {
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [phone, setPhone] = useState("");
  const [phoneEdit, setPhoneEdit] = useState(false);
  const [phoneInput, setPhoneInput] = useState("");
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const { user, signOut, loading: authLoading } = useAuth();
  const router = useRouter();

  const fullName = user?.displayName || user?.email || "";
  const email = user?.email || "";

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    async function fetchData() {
      try {
        const [ordersRes, profileRes] = await Promise.all([
          fetch("/api/orders", { cache: "no-store" }),
          fetch("/api/profile", { cache: "no-store" }),
        ]);
        if (ordersRes.ok) {
          const data = await ordersRes.json();
          setOrders(data.orders || []);
        }
        if (profileRes.ok) {
          const data = await profileRes.json();
          if (data.profile?.phone) {
            setPhone(data.profile.phone);
            setPhoneInput(data.profile.phone);
          }
        }
      } catch (err) {
        console.error("Failed to fetch data:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [authLoading, user, router]);

  async function handleSavePhone() {
    const trimmed = phoneInput.trim();
    if (!/^[+\d][\d\s()-]{6,19}$/.test(trimmed)) {
      setPhoneError("Please enter a valid phone number.");
      return;
    }
    setPhoneError(null);
    try {
      const res = await fetch("/api/profile/phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save phone");
      setPhone(trimmed);
      setPhoneEdit(false);
    } catch (err) {
      setPhoneError(err instanceof Error ? err.message : "Failed to save phone.");
    }
  }

  async function handleSignOut() {
    await signOut();
    router.replace("/login");
  }

  return (
    <>
      <Navbar />
      <main className={styles.main}>
        <div className={styles.header}>
          <h1 className={styles.title}>My Account</h1>
          <p className={styles.subtitle}>Manage your orders, custom designs, and account settings.</p>
        </div>

        <div className={styles.contentGrid}>
          <div>
            <div className={`glass-panel ${styles.profileCard}`}>
              <div className={styles.avatar}>
                {fullName.charAt(0).toUpperCase()}
              </div>
              <div className={styles.userInfo}>
                <h3>{fullName}</h3>
                <p>{email}</p>
                {!phoneEdit ? (
                  <p className={styles.userPhone}>
                    {phone ? phone : <em>No phone on file</em>}
                    <button
                      type="button"
                      className={styles.editPhoneBtn}
                      onClick={() => {
                        setPhoneInput(phone);
                        setPhoneEdit(true);
                      }}
                    >
                      Edit
                    </button>
                  </p>
                ) : (
                  <div className={styles.phoneEditor}>
                    <input
                      type="tel"
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value)}
                      placeholder="+91 98123 45678"
                    />
                    {phoneError && <span className={styles.phoneError}>{phoneError}</span>}
                    <div className={styles.phoneActions}>
                      <button type="button" onClick={handleSavePhone} className={styles.phoneSave}>Save</button>
                      <button type="button" onClick={() => setPhoneEdit(false)} className={styles.phoneCancel}>Cancel</button>
                    </div>
                  </div>
                )}
              </div>

              <div className={styles.actionList}>
                <button className={styles.actionBtn} onClick={() => router.push("/profile/orders")}>
                  <span>My Orders</span>
                  <span className={`material-symbols-outlined ${styles.icon}`}>inventory_2</span>
                </button>
                <button className={styles.actionBtn} onClick={() => router.push("/profile/addresses")}>
                  <span>Saved Addresses</span>
                  <span className={`material-symbols-outlined ${styles.icon}`}>location_on</span>
                </button>
                <button className={`${styles.actionBtn} ${styles.btnDanger}`} onClick={handleSignOut}>
                  <span>Sign Out</span>
                  <span className={`material-symbols-outlined ${styles.icon}`}>logout</span>
                </button>
              </div>
            </div>
          </div>

          <div className={styles.ordersArea}>
            <div>
              <h2 className={styles.sectionTitle}>
                <span className="material-symbols-outlined">inventory_2</span>
                Order History
              </h2>

              {loading && <p>Loading orders...</p>}
              {!loading && orders.length === 0 && <p>You have no recent orders.</p>}

              {!loading && orders.map(order => (
                <div key={order.id} className={`glass-panel ${styles.orderCard}`}>
                  <div className={styles.orderHeader}>
                    <div>
                      <div className={styles.orderId}>#{order.id.slice(0, 8).toUpperCase()}</div>
                      <div className={styles.orderDate}>Placed on {new Date(order.created_at as string).toLocaleDateString()}</div>
                    </div>
                    <div className={`${styles.orderStatus} ${order.status === 'delivered' ? styles.statusPaid : styles.statusPending}`}>{order.status}</div>
                  </div>
                  <div className={styles.orderBody}>
                    {(parseItemsSnapshot(order.items_snapshot).length
                      ? (parseItemsSnapshot(order.items_snapshot) as unknown as OrderItemView[]).map((snap, i: number) => ({
                          id: `${order.id}-${i}`, title: snap.title, quantity: snap.quantity, unit_price: snap.unit_price, custom: !!snap.design_id,
                        })) as OrderItemView[]
                      : ((order.order_items || []) as OrderItemView[])
                    ).map((item) => (
                      <div key={item.id} className={styles.orderItem}>
                        <div className={styles.itemDetails}>
                          <div className={styles.itemTitle}>{item.title || "Item"}</div>
                          <div className={styles.itemVariant}>
                            Qty: {item.quantity}
                            {item.custom_design_id && " + Custom Design"}
                            {item.color && <> · {item.color}/{item.size}</>}
                          </div>
                        </div>
                        <div className={styles.itemPrice}>{inr(Number(item.unit_price) * item.quantity)}</div>
                      </div>
                    ))}
                  </div>
                  <div className={styles.orderFooter}>
                    <div>Total: <span className={styles.orderTotal}>{inr(Number(order.total_amount))}</span></div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <a href={`/order/${order.id}`} className={styles.btnTrack} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', textDecoration: 'none' }}>View Details</a>
                      <a href={`/profile/invoice/${order.id}`} className={styles.btnTrack} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', textDecoration: 'none' }}>Invoice</a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}