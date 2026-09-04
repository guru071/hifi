"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import type { ProductWithDetails } from "@/lib/services/catalog";
import type { ProductReviewWithUser } from "@/lib/supabase/rows";

export default function ProductDetail({ params }: { params: Promise<{ id: string }> }) {
  const [product, setProduct] = useState<ProductWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [id, setId] = useState<string>("");

  const { addItem } = useCart();
  const { user } = useAuth();
  const router = useRouter();

  const [reviews, setReviews] = useState<ProductReviewWithUser[]>([]);
  const [avgRating, setAvgRating] = useState<number>(0);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewMsg, setReviewMsg] = useState("");
  const [reviewErr, setReviewErr] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmitReview() {
    if (!user) {
      setReviewErr("Please sign in to submit a review.");
      return;
    }
    setSubmitting(true);
    setReviewMsg("");
    setReviewErr("");
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ product_id: id, rating: reviewRating, comment: reviewComment }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit review");
      setReviewMsg("Thanks! Your review has been submitted for approval.");
      setReviewComment("");
      setReviewRating(5);
    } catch (err) {
      setReviewErr((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }



  useEffect(() => {
    async function resolveParams() {
        const resolvedParams = await params;
        setId(resolvedParams.id);
    }
    resolveParams();
  }, [params]);

  useEffect(() => {
    if (!id) return;
    async function fetchProductAndReviews() {
      try {
        // Fetch the single product
        const res = await fetch(`/api/products/${id}`);
        if (!res.ok) throw new Error("Failed to fetch product");
        const data = await res.json();
        const found = data.product;
        if (!found) throw new Error("Product not found");
        setProduct(found);
        
        if (found.product_variants && found.product_variants.length > 0) {
          setSelectedColor(found.product_variants[0].color);
          setSelectedSize(found.product_variants[0].size);
        }

        // Fetch reviews
        const reviewRes = await fetch(`/api/reviews?productId=${found.id}`);
        if (reviewRes.ok) {
          const reviewData = await reviewRes.json();
          setReviews(reviewData.reviews || []);
          if (reviewData.reviews && reviewData.reviews.length > 0) {
            const sum = reviewData.reviews.reduce((acc: number, r: ProductReviewWithUser) => acc + r.rating, 0);
            setAvgRating(sum / reviewData.reviews.length);
          }
        }
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }
    fetchProductAndReviews();
  }, [id]);

  if (loading) return <><Navbar/><main className={styles.main}><div className={styles.header}><h1>Loading...</h1></div></main><Footer/></>;
  if (error || !product) return <><Navbar/><main className={styles.main}><div className={styles.header}><h1>{error || "Product not found"}</h1></div></main><Footer/></>;

  // Extract unique colors and sizes
  const availableColors = Array.from(new Set(product.product_variants?.map((v) => v.color) || []));
  const availableSizes = Array.from(new Set(product.product_variants?.map((v) => v.size) || []));

  // Check if current selection is in stock (inventory_count, not the nonexistent stock_quantity)
  const currentVariant = product.product_variants?.find((v) => v.color === selectedColor && v.size === selectedSize);
  const isInStock = !!currentVariant && Number(currentVariant.inventory_count) > 0;

  const heroImage = product.images?.[0]?.url || product.image_url || product.product_images?.[0]?.url;
  const galleryImages = (product.product_images?.filter((i) => i.url) || []).slice(0, 3);

  const inrPrice = (n: number) => `₹${Number(n).toFixed(2)}`;

  return (
    <>
      <Navbar />
      <main className={styles.main}>
        <div className={styles.gridContainer}>
          {/* Gallery (Left) */}
          <div className={styles.galleryArea}>
            <div className={styles.mainImageContainer}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={heroImage}
                alt={product.title}
                className={styles.mainImage}
              />
            </div>
            <div className={styles.thumbnails}>
              {galleryImages.map((img, i: number) => (
                <button key={i} className={styles.thumbnailBtn}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.url} alt={img.alt || product.title} className={styles.mainImage} />
                </button>
              ))}
            </div>
          </div>

          {/* Details (Right) */}
          <div className={styles.detailsArea}>
            {/* Header */}
            <div className={styles.header}>
              <h1 className={styles.title}>{product.title}</h1>
              <div className={styles.priceRow}>
                <span className={styles.price}>{inrPrice(Number(product.base_price))}</span>
                <div className={styles.rating}>
                  <span className="material-symbols-outlined" style={{ fontSize: "16px", fontVariationSettings: "'FILL' 1" }}>
                    star
                  </span>
                  <span>{reviews.length > 0 ? `${avgRating.toFixed(1)} (${reviews.length} reviews)` : "No reviews yet"}</span>
                </div>
              </div>
            </div>

            {/* Selectors */}
            <div className={styles.selectors}>
              {/* Color */}
              <div className={styles.selectorGroup}>
                <span className={styles.selectorLabel}>Color: {selectedColor}</span>
                <div className={styles.colorList}>
                  {availableColors.map((color) => (
                    <button 
                      key={color}
                      className={`${styles.colorBtn} ${selectedColor === color ? styles.colorBtnActive : ""}`} 
                      style={{ backgroundColor: color.toLowerCase() === 'bone' ? '#f5f5dc' : color.toLowerCase() }}
                      onClick={() => setSelectedColor(color)}
                      title={color}
                    />
                  ))}
                </div>
              </div>

              {/* Size */}
              <div className={styles.selectorGroup}>
                <div className={styles.selectorLabel}>
                  <span>Size</span>
                  <button className={styles.sizeGuide}>Size Guide</button>
                </div>
                <div className={styles.sizeGrid}>
                  {availableSizes.map((size) => {
                    const variantForSize = product.product_variants?.find((v) => v.color === selectedColor && v.size === size);
                    const isOutOfStock = !variantForSize || Number(variantForSize.inventory_count) <= 0;
                    return (
                      <button 
                        key={size}
                        className={`${styles.sizeBtn} ${selectedSize === size ? styles.sizeBtnActive : ""} ${isOutOfStock ? styles.sizeBtnDisabled : ""}`}
                        onClick={() => !isOutOfStock && setSelectedSize(size)}
                        disabled={isOutOfStock}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
                {!isInStock && <p style={{ color: "var(--color-error)", fontSize: "12px", marginTop: "0.5rem" }}>This combination is out of stock.</p>}
              </div>
            </div>


            {/* Actions */}
            <div className={styles.actionGroup}>
              <button 
                className={styles.primaryBtn}
                onClick={() => {
                  if (isInStock) {
                    addItem({
                      id: "", // assigned by context
                      productId: product.id,
                      variantId: currentVariant?.id,
                      title: product.title,
                      color: selectedColor,
                      size: selectedSize,
                      price: Number(product.base_price) + Number(currentVariant?.price_adjustment || 0),
                      quantity: 1,
                      imageUrl: heroImage,
                      stock: Number(currentVariant?.inventory_count) || undefined
                    });
                    
                    // Analytics tracking
                    fetch('/api/analytics', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        event_type: 'add_to_cart',
                        page_url: window.location.pathname,
                        session_id: sessionStorage.getItem('hifi_session') || '',
                        product_id: product.id,
                        metadata: { color: selectedColor, size: selectedSize }
                      })
                    }).catch(console.error);
                    
                    alert("Added to cart!");
                  }
                }}
              >Add to Cart</button>
              <button
                className={styles.secondaryBtn}
                onClick={() => {
                  if (!isInStock) return;
                  addItem({
                    id: "",
                    productId: product.id,
                    variantId: currentVariant?.id,
                    title: product.title,
                    color: selectedColor,
                    size: selectedSize,
                    price: Number(product.base_price) + Number(currentVariant?.price_adjustment || 0),
                    quantity: 1,
                    imageUrl: heroImage,
                    stock: Number(currentVariant?.inventory_count) || undefined
                  });
                  router.push("/checkout");
                }}
              >Buy Now</button>
            </div>

            {/* Details Accordions */}
            <div className={styles.accordionGroup}>
              <details className={styles.accordion}>
                <summary className={styles.accordionSummary}>
                  Fabric & Fit
                  <span className="material-symbols-outlined">expand_more</span>
                </summary>
                <div className={styles.accordionContent}>
                  Knitted from 100% organic cotton at a substantial 240gsm. Features a relaxed, boxy fit with dropped shoulders and a tight crewneck. Pre-shrunk for lasting structure.
                </div>
              </details>
              <details className={styles.accordion}>
                <summary className={styles.accordionSummary}>
                  Printing Process
                  <span className="material-symbols-outlined">expand_more</span>
                </summary>
                <div className={styles.accordionContent}>
                  We utilize advanced Direct-to-Garment (DTG) printing with eco-friendly inks that bond directly with the fabric fibers, ensuring a soft hand-feel and incredible durability without cracking.
                </div>
              </details>
              <details className={styles.accordion}>
                <summary className={styles.accordionSummary}>
                  Shipping
                  <span className="material-symbols-outlined">expand_more</span>
                </summary>
                <div className={styles.accordionContent}>
                  Free standard shipping on orders over ₹1500. Custom orders require 3-5 business days for production before dispatch.
                </div>
              </details>
              <details className={styles.accordion}>
                <summary className={styles.accordionSummary}>
                  Reviews ({reviews.length})
                  <span className="material-symbols-outlined">expand_more</span>
                </summary>
                <div className={styles.accordionContent} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {reviews.length === 0 ? (
                    <p>No reviews yet. Be the first to review this product!</p>
                  ) : (
                    reviews.map(review => (
                      <div key={review.id} style={{ padding: '1rem', background: 'var(--color-surface)', borderRadius: 'var(--radius-sm)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                          <span style={{ fontWeight: 600 }}>{review.users?.full_name || 'Verified Customer'}</span>
                          <span>{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span>
                        </div>
                        <p style={{ fontSize: '14px', color: 'var(--color-secondary)' }}>{review.comment}</p>
                      </div>
                    ))
                  )}
                  {user && (
                    <div style={{ padding: '1rem', background: 'var(--color-surface-container-high)', borderRadius: 'var(--radius-lg)', marginTop: '1rem' }}>
                      <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Write a review</div>
                      <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '0.75rem' }}>
                        {[1, 2, 3, 4, 5].map(star => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setReviewRating(star)}
                            aria-label={`${star} star${star > 1 ? 's' : ''}`}
                            style={{
                              background: 'none', border: 'none', cursor: 'pointer',
                              fontSize: '1.25rem', color: star <= reviewRating ? '#fbbf24' : 'var(--color-on-surface-variant)',
                            }}
                          >
                            ★
                          </button>
                        ))}
                      </div>
                      <textarea
                        value={reviewComment}
                        onChange={e => setReviewComment(e.target.value)}
                        placeholder="Share your experience with this product..."
                        style={{
                          width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-lg)',
                          background: 'var(--color-surface)', color: 'var(--color-on-surface)',
                          border: '1px solid var(--color-outline-variant)', resize: 'vertical', minHeight: '4rem',
                          marginBottom: '0.75rem',
                        }}
                      />
                      {reviewMsg && <p style={{ color: 'var(--color-primary)', fontSize: '13px', marginBottom: '0.5rem' }}>{reviewMsg}</p>}
                      {reviewErr && <p style={{ color: 'var(--color-error)', fontSize: '13px', marginBottom: '0.5rem' }}>{reviewErr}</p>}
                      <button
                        type="button"
                        disabled={submitting}
                        onClick={handleSubmitReview}
                        style={{
                          padding: '0.5rem 1.25rem', background: 'var(--color-primary)', color: 'var(--color-on-primary)',
                          border: 'none', borderRadius: 'var(--radius-full)', fontWeight: 600, cursor: submitting ? 'wait' : 'pointer',
                        }}
                      >
                        {submitting ? 'Submitting...' : 'Submit Review'}
                      </button>
                    </div>
                  )}
                </div>
              </details>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
