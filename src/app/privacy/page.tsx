"use client";

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import styles from "@/styles/static.module.css";

export default function Privacy() {
  return (
    <>
      <Navbar />
      <main className={styles.main}>
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>Privacy Policy</h1>
        </div>
        <div className={`${styles.content} glass-panel`} style={{ padding: '2rem' }}>
          <h2>Information We Collect</h2>
          <p>
            When you visit the Site, we automatically collect certain information about your device, including information about your web browser, IP address, time zone, and some of the cookies that are installed on your device.
          </p>
          
          <h2>How We Use Your Information</h2>
          <p>
            We use the Order Information that we collect generally to fulfill any orders placed through the Site (including processing your payment information, arranging for shipping, and providing you with invoices and/or order confirmations).
          </p>
          <p>
            Additionally, we use this Order Information to:
          </p>
          <ul>
            <li>Communicate with you;</li>
            <li>Screen our orders for potential risk or fraud; and</li>
            <li>When in line with the preferences you have shared with us, provide you with information or advertising relating to our products or services.</li>
          </ul>

          <h2>Custom Designs & WhatsApp Data</h2>
          <p>
            Designs submitted via WhatsApp are associated securely with your HIFI account and order session. Original artwork files are kept securely in private storage and are only used for the purpose of fulfilling your custom apparel order. We do not use your custom designs for our own branding or resell them.
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
