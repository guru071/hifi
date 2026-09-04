"use client";

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import styles from "@/styles/static.module.css";

export default function Terms() {
  return (
    <>
      <Navbar />
      <main className={styles.main}>
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>Terms of Service</h1>
        </div>
        <div className={`${styles.content} glass-panel`} style={{ padding: '2rem' }}>
          <h2>1. Terms</h2>
          <p>
            By accessing this website, you are agreeing to be bound by these website Terms and Conditions of Use, all applicable laws and regulations, and agree that you are responsible for compliance with any applicable local laws.
          </p>
          
          <h2>2. Use License</h2>
          <p>
            Permission is granted to temporarily download one copy of the materials (information or software) on HIFI&apos;s website for personal, non-commercial transitory viewing only.
          </p>

          <h2>3. Custom Designs</h2>
          <p>
            By submitting a custom design via WhatsApp or any other channel, you affirm that you own the rights to the artwork or have explicit permission to reproduce it. HIFI Premium Customs reserves the right to reject any design that violates copyright law, contains hate speech, or does not meet our printing standards.
          </p>
          <p>
            Due to the bespoke nature of custom apparel, we do not accept returns or exchanges on custom-printed items unless there is a manufacturing defect.
          </p>

          <h2>4. Limitations</h2>
          <p>
            In no event shall HIFI or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on HIFI&apos;s website.
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
