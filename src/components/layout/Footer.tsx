import Link from "next/link";
import styles from "./Footer.module.css";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerContainer}>
        <div className={styles.brandColumn}>
          <div className={styles.brandName}>HIFI</div>
          <p className={styles.copyright}>© 2024 HIFI PREMIUM CUSTOMS</p>
        </div>
        <div className={styles.linksColumn}>
          <Link href="/privacy" className={styles.link}>
            Privacy Policy
          </Link>
          <Link href="/terms" className={styles.link}>
            Terms of Service
          </Link>
          <Link href="/shipping" className={styles.link}>
            Shipping Info
          </Link>
          <Link href="/contact" className={styles.link}>
            Contact Us
          </Link>
        </div>
      </div>
    </footer>
  );
}
