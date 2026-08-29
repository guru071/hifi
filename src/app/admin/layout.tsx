"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import styles from "./layout.module.css";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function guard() {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        const data = await res.json();
        if (!data.user || data.role !== "admin") {
          router.replace("/login");
          return;
        }
      } catch {
        router.replace("/login");
        return;
      } finally {
        setChecking(false);
      }
    }
    guard();
  }, [router]);

  if (checking) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-secondary)" }}>
        Verifying admin access...
      </div>
    );
  }

  return (
    <div className={styles.adminLayout}>
      {/* SideNavBar Component */}
      <nav className={styles.sidebar}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.avatar}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src="/logo.jpeg" 
              alt="HIFI Admin Logo" 
            />
          </div>
          <div>
            <h1 className={styles.adminTitle}>HIFI Admin</h1>
            <p className={styles.adminSubtitle}>Premium Management</p>
          </div>
        </div>

        {/* Main Navigation */}
        <div className={styles.navLinks}>
          <Link href="/admin" className={`${styles.navLink} ${pathname === "/admin" ? styles.navLinkActive : ""}`}>
            <span className="material-symbols-outlined">dashboard</span>
            <span className={styles.navLabel}>Dashboard</span>
          </Link>
          <Link href="/admin/orders" className={`${styles.navLink} ${pathname.startsWith("/admin/orders") ? styles.navLinkActive : ""}`}>
            <span className="material-symbols-outlined">receipt_long</span>
            <span className={styles.navLabel}>Orders</span>
          </Link>
          <Link href="/admin/products" className={`${styles.navLink} ${pathname.startsWith("/admin/products") ? styles.navLinkActive : ""}`}>
            <span className="material-symbols-outlined">inventory_2</span>
            <span className={styles.navLabel}>Products</span>
          </Link>
          <Link href="/admin/queue" className={`${styles.navLink} ${pathname.startsWith("/admin/queue") ? styles.navLinkActive : ""}`}>
            <span className="material-symbols-outlined">palette</span>
            <span className={styles.navLabel}>Custom Queue</span>
          </Link>
          <Link href="/admin/customers" className={`${styles.navLink} ${pathname.startsWith("/admin/customers") ? styles.navLinkActive : ""}`}>
            <span className="material-symbols-outlined">group</span>
            <span className={styles.navLabel}>Customers</span>
          </Link>
          <Link href="/admin/reviews" className={`${styles.navLink} ${pathname.startsWith("/admin/reviews") ? styles.navLinkActive : ""}`}>
            <span className="material-symbols-outlined">star</span>
            <span className={styles.navLabel}>Reviews</span>
          </Link>
          <Link href="/admin/audit" className={`${styles.navLink} ${pathname.startsWith("/admin/audit") ? styles.navLinkActive : ""}`}>
            <span className="material-symbols-outlined">history</span>
            <span className={styles.navLabel}>Audit Log</span>
          </Link>
          <Link href="/admin/settings" className={`${styles.navLink} ${pathname === "/admin/settings" ? styles.navLinkActive : ""}`}>
            <span className="material-symbols-outlined">settings</span>
            <span className={styles.navLabel}>Settings</span>
          </Link>
        </div>

        {/* CTA */}
        <div className={styles.ctaContainer}>
          <Link href="/admin/products?create=1" className={styles.ctaBtn} style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}>New Product</Link>
        </div>

        {/* Footer Navigation */}
        <div className={styles.footerNav}>
          <Link href="/" className={styles.navLink}>
            <span className="material-symbols-outlined">storefront</span>
            <span className={styles.navLabel}>Storefront</span>
          </Link>
          <Link href="/api/auth/logout" className={styles.navLink}>
            <span className="material-symbols-outlined">logout</span>
            <span className={styles.navLabel}>Log Out</span>
          </Link>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className={styles.mainContent}>
        {children}
      </main>
    </div>
  );
}
