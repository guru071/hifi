"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import styles from "./page.module.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ProductCard from "@/components/ui/ProductCard";
import type { ProductWithDetails } from "@/lib/services/catalog";

type FeaturedProduct = {
  id: string;
  title: string;
  subtitle: string;
  price: number;
  imageUrl: string;
  imageAlt: string;
  soldOut: boolean;
  inr: boolean;
};

export default function Home() {
  const [products, setProducts] = useState<FeaturedProduct[]>([]);

  useEffect(() => {
    async function fetchFeatured() {
      try {
        const res = await fetch("/api/products");
        if (res.ok) {
          const data = await res.json();
          const formatted = data.products.slice(0, 3).map((p: ProductWithDetails) => ({
            id: p.id,
            title: p.title,
            subtitle: (p.category_name || p.category) as string,
            price: Number(p.base_price),
            imageUrl: p.image_url as string,
            imageAlt: p.title,
            soldOut: !(p.product_variants || []).some((v) => Number(v.inventory_count) > 0),
            inr: true,
          }));
          setProducts(formatted);
        }
      } catch (err) {
        console.error(err);
      }
    }
    fetchFeatured();
  }, []);

  return (
    <main className={styles.main}>
      <Navbar />

      {/* Immersive Hero Section */}
      <section className={styles.heroSection}>
        <div className={styles.heroImageContainer}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAa2vpmi_-PjziA27i1el1AHXo8ZxuHWXZ-q58THPNqHLnUzlXazuOOXiMm96Ht0MIlqYdO6UlMS8bffDPXPCD5GGSf2z4d9RB6p7bPytndNL3RnWqOUAOD83WVptxOU04KTOyL7ujtBH5zzNCWqByI3ulTe3gpjMcFcB8U_nOjZGYzghEMQ8uibhZ_ZZiQygL6K4O4SgdV8TIRCA264nmJcYiOJ77H1bm5nR71qCQ26z9Obe5fmWkj"
            alt="Premium white T-shirt on model"
            className={styles.heroImage}
          />
        </div>
        <div className={styles.heroContent}>
          <div className={`${styles.heroPanel} glass-panel`}>
            <h1 className={styles.heroTitle}>THE PERFECT CANVAS.</h1>
            <p className={styles.heroSubtitle}>
              Premium quality meets your original expression. Hand-customized in our studio.
            </p>
            <Link href="#collection" className={styles.heroButton}>
              Explore the Collection
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Collection Section */}
      <section id="collection" className={styles.collectionSection}>
        <div className={styles.collectionHeader}>
          <h2 className={styles.collectionTitle}>Core Essentials</h2>
          <Link href="/shop" className={styles.viewAllLink}>
            VIEW ALL
          </Link>
        </div>
        <div className={styles.productGrid}>
          {products.map((product) => (
            <ProductCard key={product.id} {...product} />
          ))}
        </div>
      </section>

      {/* Process Section */}
      <section className={styles.processSection}>
        <div className={styles.processContainer}>
          <div className={styles.processHeader}>
            <h2 className={styles.processTitle}>The Process</h2>
            <p className={styles.processSubtitle}>
              Three simple steps to transform our premium blanks into your bespoke garment.
            </p>
          </div>
          <div className={styles.processGrid}>
            <div className={styles.connectingLine}></div>
            
            {/* Step 1 */}
            <div className={styles.processStep}>
              <div className={`${styles.processIconContainer} glass-panel`}>
                <span className={`material-symbols-outlined ${styles.processIcon}`}>apparel</span>
              </div>
              <h4 className={styles.processStepTitle}>1. Select Base</h4>
              <p className={styles.processStepDesc}>
                Choose from our meticulously crafted silhouettes and weights.
              </p>
            </div>
            
            {/* Step 2 */}
            <div className={styles.processStep}>
              <div className={`${styles.processIconContainer} glass-panel`}>
                <span className={`material-symbols-outlined ${styles.processIcon}`}>draw</span>
              </div>
              <h4 className={styles.processStepTitle}>2. Send Design</h4>
              <p className={styles.processStepDesc}>
                Upload your artwork or work with our studio to refine your vision.
              </p>
            </div>
            
            {/* Step 3 */}
            <div className={styles.processStep}>
              <div className={`${styles.processIconContainer} glass-panel`}>
                <span className={`material-symbols-outlined ${styles.processIcon}`}>local_shipping</span>
              </div>
              <h4 className={styles.processStepTitle}>3. Hand-Printed</h4>
              <p className={styles.processStepDesc}>
                Expertly applied in our studio and delivered with care.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Brand Story Section */}
      <section className={styles.brandSection}>
        <div className={styles.brandGrid}>
          <div className={styles.brandTextContent}>
            <h2 className={styles.brandTitle}>Crafted with Precision.</h2>
            <p className={styles.brandDescLarge}>
              At HIFI, we believe that true luxury lies in the details. Our manual customization process ensures that every piece is unique, reflecting the meticulous craftsmanship of our studio artisans.
            </p>
            <p className={styles.brandDescSmall}>
              We reject mass production in favor of a thoughtful, hands-on approach. From selecting the finest raw materials to the final press of the print, our process is designed to deliver garments that look exceptional and feel deeply personal.
            </p>
            <button className={styles.brandLink}>
              DISCOVER OUR STUDIO
            </button>
          </div>
          <div className={styles.brandImageContainer}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAWQJnic-iD81YOeUJK7Wb4xaxA4wghQZNfjcgxroAnt_2xKh-BCA1_aE1q3JIRe8iv_RFG7Xvi5N5bjnGw6E0f948sj4OyuaVs7YYNykvqPhcxSNwtFefQTUetDjsN8bBLVtWC47QgTajJMcvCYEKfAJ1fC_jW8WjbPtWWEJbEtlf6080d5RmMC2cZf-37cXOSTHupDvTemN8kfVrnz1XMZ3K4eo65aK6hkmUjXziAkGU87YkhOjFK"
              alt="Studio printing process"
              className={styles.brandImage}
            />
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
