"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";

const inr = (n: number) => `₹${Number(n).toFixed(2)}`;

type OrderWithUsers = {
  id: string;
  user_id: string;
  total_amount: number | string;
  payment_status: string;
  status: string;
  created_at: string;
  users?: {
    full_name: string;
    email: string;
  };
  [key: string]: unknown;
};

export default function AdminDashboard() {
  const router = useRouter();
  const [orders, setOrders] = useState<OrderWithUsers[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingDesignsCount, setPendingDesignsCount] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [weeklyVolume, setWeeklyVolume] = useState<number[]>(Array(7).fill(0));

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const [ordersRes, designsRes, productsRes, analyticsRes] = await Promise.all([
          fetch("/api/orders"),
          fetch("/api/designs"),
          fetch("/api/products"),
          fetch("/api/analytics?eventType=page_view") // using page views as a proxy for volume activity
        ]);

        if (ordersRes.ok) {
          const data = await ordersRes.json();
          setOrders(data.orders || []);
        }

        if (designsRes.ok) {
          const data = await designsRes.json();
          const pending = (data.designs || []).filter((d: { status: string }) => d.status === 'pending');
          setPendingDesignsCount(pending.length);
        }

        if (productsRes.ok) {
          const data = await productsRes.json();
          let lowStock = 0;
          (data.products || []).forEach((p: { product_variants?: { inventory_count: number }[] }) => {
            (p.product_variants || []).forEach((v: { inventory_count: number }) => {
              if (v.inventory_count < 10) lowStock++;
            });
          });
          setLowStockCount(lowStock);
        }

        if (analyticsRes.ok) {
          const data = await analyticsRes.json();
          // Group by day of week for the chart
          const volumes = Array(7).fill(0);
          (data.events || []).forEach((e: { created_at: string }) => {
            const date = new Date(e.created_at);
            volumes[date.getDay()]++;
          });
          // Normalize to percentages for the CSS bars
          const max = Math.max(...volumes, 1);
          setWeeklyVolume(volumes.map(v => (v / max) * 100));
        }

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboardData();
  }, []);

  const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total_amount), 0);
  const activeOrdersCount = orders.length;
  const paidRevenue = orders
    .filter(o => o.payment_status === 'paid')
    .reduce((sum, o) => sum + Number(o.total_amount), 0);

  return (
    <>
      <header className={styles.header}>
        <div>
          <h2 className={styles.title}>Dashboard Overview</h2>
          <p className={styles.subtitle}>Real-time metrics for HIFI Premium Customs.</p>
        </div>
        <button className={styles.mobileNavToggle}>
          <span className="material-symbols-outlined">menu</span>
        </button>
      </header>

      {/* Bento Grid Stats */}
      <div className={styles.statsGrid}>
        {/* Stat Card 1 */}
        <div className={`${styles.statCard} glass-panel`}>
          <div className={styles.statIconBg}>
            <span className="material-symbols-outlined" style={{ fontSize: "64px" }}>attach_money</span>
          </div>
          <h3 className={styles.statTitle}>Total Revenue</h3>
          <p className={styles.statValue}>{inr(totalRevenue)}</p>
          <div className={`${styles.statTrend} ${styles.trendUp}`}>
            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>trending_up</span>
            <span>Paid: {inr(paidRevenue)}</span>
          </div>
        </div>

        {/* Stat Card 2 */}
        <div className={`${styles.statCard} glass-panel`}>
          <div className={styles.statIconBg}>
            <span className="material-symbols-outlined" style={{ fontSize: "64px" }}>shopping_cart</span>
          </div>
          <h3 className={styles.statTitle}>Active Orders</h3>
          <p className={styles.statValue}>{activeOrdersCount}</p>
          <div className={`${styles.statTrend} ${styles.trendNeutral}`}>
            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>schedule</span>
            <span>Needs fulfillment</span>
          </div>
        </div>

        {/* Stat Card 3 */}
        <div className={`${styles.statCard} glass-panel`}>
          <div className={styles.statIconBg}>
            <span className="material-symbols-outlined" style={{ fontSize: "64px" }}>design_services</span>
          </div>
          <h3 className={styles.statTitle}>Designs Pending</h3>
          <p className={styles.statValue}>{pendingDesignsCount}</p>
          <div className={`${styles.statTrend} ${styles.trendUp}`}>
            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>hourglass_empty</span>
            <span>Awaiting approval</span>
          </div>
        </div>

        {/* Stat Card 4 */}
        <div className={`${styles.statCard} glass-panel`} style={{ backgroundColor: "rgba(232, 232, 232, 0.3)" }}>
          <div className={styles.statIconBg}>
            <span className="material-symbols-outlined" style={{ fontSize: "64px" }}>warning</span>
          </div>
          <h3 className={styles.statTitle}>Low Stock Alerts</h3>
          <p className={styles.statValue}>{lowStockCount || "-"}</p>
          <div className={`${styles.statTrend} ${styles.trendWarning}`}>
            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>error</span>
            <span>Check Inventory</span>
          </div>
        </div>
      </div>

      {/* Main Layout Split */}
      <div className={styles.mainLayoutSplit}>
        {/* Recent Orders Table */}
        <div className={`${styles.recentOrdersCard} glass-panel`}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>Recent Orders</h3>
            <button className={styles.viewAllBtn} onClick={() => router.push("/admin/orders")}>
              View All <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>arrow_forward</span>
            </button>
          </div>
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th}>Order ID</th>
                  <th className={styles.th}>Customer</th>
                  <th className={styles.th}>Amount</th>
                  <th className={styles.th} style={{ textAlign: "right" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {loading && <tr><td colSpan={4} style={{textAlign: "center", padding: "1rem"}}>Loading...</td></tr>}
                {!loading && orders.length === 0 && <tr><td colSpan={4} style={{textAlign: "center", padding: "1rem"}}>No orders found.</td></tr>}
                {!loading && orders.slice(0, 5).map(order => (
                  <tr key={order.id} className={styles.tr}>
                    <td className={`${styles.td} ${styles.orderId}`}>#{order.id.slice(0, 8)}</td>
                    <td className={styles.td}>
                      <span className={styles.customerName}>{order.users?.full_name || order.user_id || "Guest User"}</span>
                    </td>
                    <td className={styles.td}>
                      {inr(Number(order.total_amount))}
                    </td>
                    <td className={styles.td} style={{ textAlign: "right" }}>
                      <span className={`${styles.statusBadge} ${order.status === 'pending_payment' ? styles.statusPending : styles.statusActive}`}>
                        <span className={`${styles.statusDot} ${order.status === 'pending_payment' ? styles.statusDotPending : styles.statusDotActive}`}></span> {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Side Panel (Chart & Actions) */}
        <div className={styles.sidePanel}>
          {/* Chart Area */}
          <div className={`${styles.chartCard} glass-panel`}>
            <h3 className={styles.chartTitle}>Weekly Volume (Page Views)</h3>
            <div className={styles.chartArea}>
              {weeklyVolume.map((vol, index) => (
                <div key={index} className={styles.chartBar} style={{ height: `${Math.max(vol, 5)}%` }} title={`Day ${index}: ${vol.toFixed(0)}%`}></div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className={`${styles.actionsCard} glass-panel`}>
            <h3 className={styles.chartTitle}>Quick Actions</h3>
            <div className={styles.actionList}>
              <Link href="/admin/products" className={styles.actionBtn} style={{ textDecoration: 'none' }}>
                <span className={styles.actionText}>Manage Inventory</span>
                <span className={`material-symbols-outlined ${styles.actionIcon}`} style={{ fontSize: "18px" }}>arrow_forward</span>
              </Link>
              <button className={styles.actionBtn} onClick={() => window.print()}>
                <span className={styles.actionText}>Print Weekly Report</span>
                <span className={`material-symbols-outlined ${styles.actionIcon}`} style={{ fontSize: "18px" }}>print</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
