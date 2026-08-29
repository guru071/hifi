"use client";

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import styles from "@/styles/static.module.css";

export default function Shipping() {
  return (
    <>
      <Navbar />
      <main className={styles.main}>
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>Shipping Information</h1>
        </div>
        <div className={`${styles.content} glass-panel`} style={{ padding: '2rem' }}>
          <h2>Domestic Shipping</h2>
          <p>
            All standard blank orders are processed within 1-2 business days. Standard shipping generally takes 3-5 business days. 
            We offer expedited shipping options at checkout for an additional fee.
          </p>
          
          <h2>Custom Order Timelines</h2>
          <p>
            Custom design orders require additional processing time. Once your design is submitted via WhatsApp and approved by our team, 
            production typically takes 3-5 business days. After production, standard shipping timelines apply.
          </p>

          <h2>International Shipping</h2>
          <p>
            We currently offer international shipping to select countries. Shipping times vary widely depending on the destination and customs processing.
            Please note that customers are responsible for any import duties, taxes, or brokerage fees that may apply to international shipments.
          </p>
          
          <h2>Order Tracking</h2>
          <p>
            Once your order has shipped, you will receive a confirmation email containing your tracking number. You can also view your order status 
            and tracking information by logging into your HIFI account.
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
