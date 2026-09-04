"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./Navbar.module.css";

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className={`${styles.nav} glass-panel`}>
      <div className={styles.navContainer}>
        <div className={styles.leftSection}>
          <Link href="/" className={styles.logo}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.jpeg" alt="HIFI" style={{ height: '24px', width: 'auto', borderRadius: '4px' }} />
          </Link>
          <div className={styles.desktopLinks}>
            <Link
              href="/shop"
              className={`${styles.link} ${
                pathname === "/shop" ? styles.activeLink : ""
              }`}
            >
              Shop
            </Link>
            <Link
              href="/collections"
              className={`${styles.link} ${
                pathname === "/collections" ? styles.activeLink : ""
              }`}
            >
              Collections
            </Link>
            <Link
              href="/brand"
              className={`${styles.link} ${
                pathname === "/brand" ? styles.activeLink : ""
              }`}
            >
              Brand
            </Link>
          </div>
        </div>
        <div className={styles.rightSection}>
          <Link href="/search" className={styles.iconButton}>
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>
              search
            </span>
          </Link>
          <Link href="/cart" className={styles.iconButton}>
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>
              shopping_bag
            </span>
          </Link>
          <Link href="/profile" className={styles.iconButton}>
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>
              account_circle
            </span>
          </Link>
        </div>
      </div>
    </nav>
  );
}
