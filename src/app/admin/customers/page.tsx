"use client";

import React, { useState, useEffect } from "react";
import styles from "./page.module.css";
import type { UserRow } from "@/lib/supabase/rows";

const inr = (n: number) => `₹${Number(n).toFixed(2)}`;

type CustomerWithStats = UserRow & {
  total_orders: number;
  total_spent: number;
  paid_orders: number;
  pending_payments: number;
};

export default function AdminCustomers() {
  const [customers, setCustomers] = useState<CustomerWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function fetchCustomers() {
      try {
        const res = await fetch("/api/customers");
        if (!res.ok) throw new Error("Failed to fetch customers");
        const data = await res.json();
        setCustomers(data.customers || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchCustomers();
  }, []);

  const filtered = customers.filter(c => {
    const q = search.toLowerCase();
    if (!q) return true;
    return `${c.full_name || ""} ${c.email || ""} ${c.phone || ""}`.toLowerCase().includes(q);
  });

  return (
    <>
      <header className={styles.header}>
        <div>
          <h2 className={styles.title}>Customers</h2>
          <p className={styles.subtitle}>Manage customer profiles and view purchase history.</p>
        </div>

        <div className={`glass-panel ${styles.controlsBar}`}>
          <div className={styles.searchWrapper}>
            <span className={`material-symbols-outlined ${styles.searchIcon}`}>search</span>
            <input 
              type="text" 
              className={styles.searchInput} 
              placeholder="Search customers..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className={styles.actionButtons}>
            <button className={styles.btnSecondary}>
              <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>filter_list</span>
              Filter
            </button>
            <button className={styles.btnSecondary}>
              <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>download</span>
              Export
            </button>
          </div>
        </div>
      </header>

      {/* Customers Data Table */}
      <section className={`glass-panel ${styles.tableSection}`}>
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th} style={{ width: "3rem" }}>
                  <input type="checkbox" />
                </th>
                <th className={styles.th}>Customer</th>
                <th className={styles.th}>Phone</th>
                <th className={styles.th} style={{ textAlign: "right" }}>Total Orders</th>
                <th className={styles.th} style={{ textAlign: "right" }}>Total Spent</th>
                <th className={styles.th} style={{ textAlign: "center" }}>Status</th>
                <th className={styles.th}></th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={7} style={{textAlign: "center", padding: "2rem"}}>Loading customers...</td></tr>}
              {!loading && filtered.length === 0 && <tr><td colSpan={7} style={{textAlign: "center", padding: "2rem"}}>{customers.length === 0 ? "No customers found." : "No customers match your search."}</td></tr>}
              
              {!loading && filtered.map(customer => (
                <tr key={customer.id} className={styles.tr}>
                  <td className={styles.td}>
                    <input type="checkbox" />
                  </td>
                  <td className={styles.td}>
                    <div className={styles.customerInfo}>
                      <div className={styles.avatar}>
                        {customer.full_name?.charAt(0).toUpperCase() || customer.email.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <span className={styles.customerName}>{customer.full_name || "Unknown"}</span>
                        <span className={styles.customerEmail}>{customer.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className={styles.td}>{customer.phone || <span style={{ color: "var(--color-on-surface-variant)" }}>—</span>}</td>
                  <td className={styles.td} style={{ textAlign: "right", fontWeight: 600 }}>{customer.total_orders}</td>
                  <td className={styles.td} style={{ textAlign: "right" }}>{inr(Number(customer.total_spent || 0))}</td>
                  <td className={styles.td} style={{ textAlign: "center" }}>
                    {customer.pending_payments > 0 ? (
                      <span className={`${styles.statusBadge} ${styles.statusPending}`}>{customer.pending_payments} pending</span>
                    ) : (
                      <span className={`${styles.statusBadge} ${styles.statusActive}`}>Active</span>
                    )}
                  </td>
                  <td className={styles.td} style={{ textAlign: "right" }}>
                    <button style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-on-surface-variant)" }}>
                      <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>more_vert</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className={styles.tableFooter}>
          <span>Showing {filtered.length} customers</span>
          <div className={styles.pagination}>
            <button className={styles.pageBtn}>
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
            <button className={`${styles.pageBtn} ${styles.pageBtnActive}`}>
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
        </div>
      </section>
    </>
  );
}
