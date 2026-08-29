"use client";

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import styles from "@/styles/static.module.css";

export default function Brand() {
  return (
    <>
      <Navbar />
      <main className={styles.main}>
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>Our Brand</h1>
        </div>
        <div className={`${styles.content} glass-panel`} style={{ padding: '2rem' }}>
          <h2>The HIFI Vision</h2>
          <p>
            HIFI Premium Customs was founded on the belief that blank apparel shouldn&apos;t feel like an afterthought. 
            We engineer garments that stand on their own—heavyweight, perfectly draped, and meticulously constructed.
          </p>
          <p>
            When you add your design to a HIFI garment, you aren&apos;t just printing a t-shirt. You are collaborating 
            with a luxury canvas designed to elevate your artwork.
          </p>
          
          <h2>Our Process</h2>
          <p>
            Every HIFI product begins with custom-milled cotton, garment-dyed for rich, lasting color, and pre-shrunk 
            for a consistent fit. We believe in slow fashion—creating pieces that last years, not weeks.
          </p>
          
          <h2>The Custom Experience</h2>
          <p>
            We&apos;ve revolutionized the custom apparel experience by integrating directly with the tools you already use. 
            Through our WhatsApp integration, submitting a design is as simple as sending a text. Our design team reviews 
            every submission to ensure it meets our premium printing standards before production begins.
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
