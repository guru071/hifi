"use client";

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import styles from "@/styles/static.module.css";

export default function Contact() {
  return (
    <>
      <Navbar />
      <main className={styles.main}>
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>Contact Us</h1>
        </div>
        
        <div className={`${styles.content} glass-panel`} style={{ padding: '2rem' }}>
          <p>
            Whether you have a question about our premium blanks, need help with a custom design submission, or want to inquire about bulk ordering, our team is here to assist you.
          </p>
          
          <div className={styles.contactGrid}>
            <div>
              <h3>General Inquiries</h3>
              <p>Email: info@hificustoms.com</p>
              <p>Response time: 1-2 business days</p>
            </div>
            
            <div>
              <h3>Custom Design Support</h3>
              <p>For immediate assistance with an active customization session, please reply directly in your WhatsApp chat thread, or email support@hificustoms.com.</p>
            </div>
          </div>
          
          <div style={{ marginTop: '3rem' }}>
            <h3>Headquarters</h3>
            <p>
              HIFI Premium Customs<br />
              123 Apparel Way<br />
              Los Angeles, CA 90001
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
