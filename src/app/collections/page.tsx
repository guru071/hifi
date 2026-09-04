"use client";

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import styles from "@/styles/static.module.css";
import Link from "next/link";

export default function Collections() {
  return (
    <>
      <Navbar />
      <main className={styles.main}>
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>Collections</h1>
        </div>
        
        <div className={styles.contactGrid}>
          <Link href="/category/heavyweight-basics" style={{ textDecoration: 'none' }}>
            <div className="glass-panel" style={{ padding: '2rem', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', cursor: 'pointer' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '48px', marginBottom: '1rem', color: 'var(--color-primary)' }}>checkroom</span>
              <h2 style={{ color: 'var(--color-on-surface)', marginBottom: '0.5rem' }}>Heavyweight Basics</h2>
              <p style={{ color: 'var(--color-on-surface-variant)' }}>Our core line of premium, garment-dyed blanks engineered for longevity.</p>
            </div>
          </Link>

          <Link href="/category/custom-studio" style={{ textDecoration: 'none' }}>
            <div className="glass-panel" style={{ padding: '2rem', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', cursor: 'pointer' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '48px', marginBottom: '1rem', color: 'var(--color-primary)' }}>brush</span>
              <h2 style={{ color: 'var(--color-on-surface)', marginBottom: '0.5rem' }}>Custom Studio</h2>
              <p style={{ color: 'var(--color-on-surface-variant)' }}>Submit your designs via our AI Studio and we will print them on our premium blanks.</p>
            </div>
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
