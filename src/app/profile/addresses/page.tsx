"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import styles from "./page.module.css";
import { useAuth } from "@/context/AuthContext";
import type { OrderWithUsers, ShippingAddress } from "@/lib/supabase/rows";
import { parseShippingAddress } from "@/lib/supabase/rows";

type AddressView = ShippingAddress & { lastUsed: string | null };

export default function Addresses() {
  const [addresses, setAddresses] = useState<AddressView[]>([]);
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
        const token = await user!.getIdToken();
        const res = await fetch("/api/orders", { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          const seen = new Map<string, AddressView>();
          (data.orders || []).forEach((order: OrderWithUsers) => {
            if (!order.shipping_address) return;
            const raw = order.shipping_address;
            let address: ShippingAddress | null = null;
            if (typeof raw === 'string') {
              address = JSON.parse(raw) as ShippingAddress;
            } else {
              address = parseShippingAddress(raw);
            }
            if (!address?.line1) return;
            const key = `${address.line1}|${address.city}|${address.postal_code}`;
            if (!seen.has(key)) seen.set(key, { ...address, lastUsed: order.created_at });
          });
          setAddresses(Array.from(seen.values()));
        }
      } catch (err) {
        console.error("Failed to fetch addresses:", err);
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
          <h1 className={styles.title}>Saved Addresses</h1>
          <p className={styles.subtitle}>Addresses used on your previous orders, ready to reuse at checkout.</p>
        </div>

        {loading && <p>Loading addresses...</p>}
        {!loading && addresses.length === 0 && (
          <div className={`glass-panel ${styles.emptyCard}`}>
            <p>No saved addresses yet. Your shipping addresses from past orders will appear here.</p>
            <Link href="/shop" style={{ color: "var(--color-primary)" }}>Start shopping</Link>
          </div>
        )}

        {!loading && addresses.length > 0 && (
          <div className={styles.grid}>
            {addresses.map((address, i) => (
              <div key={i} className={`glass-panel ${styles.addressCard}`}>
                <div className={styles.cardHeader}>
                  <span className={`material-symbols-outlined ${styles.icon}`}>location_on</span>
                  <span className={styles.lastUsed}>Last used {new Date(address.lastUsed as string).toLocaleDateString()}</span>
                </div>
                <p className={styles.address}>
                  {address.full_name && <strong>{address.full_name}</strong>}
                  <br />
                  {address.line1}{address.line2 ? <>, {address.line2}</> : null}<br />
                  {address.city}
                  {address.state ? `, ${address.state}` : null} {address.postal_code}<br />
                  {address.country}
                  {address.phone && <><br />Phone: {address.phone}</>}
                </p>
                <Link href="/checkout" className={styles.reuseBtn}>Use at checkout</Link>
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
