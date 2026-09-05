import Link from "next/link";
import styles from "./Footer.module.css";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerContainer}>
        <div className={styles.brandColumn}>
          <div className={styles.brandName}>HIFI</div>
          <p className={styles.copyright}>© 2026 HIFI PREMIUM CUSTOMS</p>
          <p className={styles.copyright}>builded by GOAT&apos;ECH and powered by MAGHGO</p>
          <a href="mailto:hificustomprinting@gmail.com" className={styles.link} style={{ fontSize: '0.875rem', marginTop: '4px' }}>
            hificustomprinting@gmail.com
          </a>
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
