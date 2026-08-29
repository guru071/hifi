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
  const [designState, setDesignState] = useState<"waiting" | "received">("waiting");
  const [designId, setDesignId] = useState<string>("");
  const [designRef, setDesignRef] = useState<string>("");
  const [uploadMethod, setUploadMethod] = useState<"none" | "upload" | "whatsapp">("none");
  const [chatMessages, setChatMessages] = useState<{sender: 'ai' | 'user', text?: string, image?: string, time?: string}[]>([
    { sender: 'ai', text: 'Hi! I am the HIFI AI Studio Assistant. Upload your design here on WhatsApp, and let me know if you have any special requirements.', time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
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
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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

  async function handleChatImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    const newMsg = { sender: 'user' as const, image: URL.createObjectURL(file), time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) };
    setChatMessages(prev => [...prev, newMsg]);
    setIsUploading(true);
    
    try {
      const refCode = "HIFI-" + Math.random().toString(36).substring(2, 6).toUpperCase();
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('referenceCode', refCode);

      const res = await fetch('/api/designs/upload', {
        method: 'POST',
        body: formData
      });
      
      const data = await res.json();
      if (data.success) {
        setDesignRef(refCode);
        setDesignId(data.designId || "");
        setDesignState("received");
        
        setChatMessages(prev => [...prev, { 
          sender: 'ai', 
          text: `Awesome design! I've attached it to reference ${refCode}. Your design is ready for printing. You can add to cart now!`,
          time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
        }]);
      } else {
        alert("Upload failed: " + (data.error || "Unknown error"));
      }
    } catch (err) {
      console.error(err);
      alert("Error uploading design");
    } finally {
      setIsUploading(false);
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

            {/* Customization Panel */}
            <div className={`${styles.customPanel} glass-panel`} style={{ padding: "1.5rem" }}>
              <div className={styles.customHeader} style={{ padding: "0 0 1rem 0" }}>
                <h3 className={styles.customTitle}>Customization</h3>
                <div style={{ fontSize: "12px", color: "var(--color-primary)" }}>
                  {designState === "waiting" ? "Required" : "Design Locked ✓"}
                </div>
              </div>
              
              {uploadMethod === "none" && designState === "waiting" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "1rem" }}>
                  <button 
                    onClick={() => setUploadMethod("upload")}
                    className={styles.secondaryBtn}
                    style={{ padding: "1rem", justifyContent: "flex-start", gap: "1rem" }}
                  >
                    <span className="material-symbols-outlined">upload_file</span>
                    UPLOAD DESIGN
                  </button>
                  <button 
                    onClick={() => setUploadMethod("whatsapp")}
                    className={styles.secondaryBtn}
                    style={{ padding: "1rem", justifyContent: "flex-start", gap: "1rem", borderColor: "#25D366", color: "#25D366" }}
                  >
                    <span className="material-symbols-outlined">chat</span>
                    SEND DESIGN THROUGH WHATSAPP
                  </button>
                </div>
              )}

              {uploadMethod === "upload" && designState === "waiting" && (
                <div style={{ padding: "2rem", border: "2px dashed var(--color-outline-variant)", borderRadius: "var(--radius-lg)", textAlign: "center", marginTop: "1rem" }}>
                  <span className="material-symbols-outlined" style={{ fontSize: "48px", color: "var(--color-outline)" }}>cloud_upload</span>
                  <p style={{ margin: "1rem 0", color: "var(--color-on-surface-variant)" }}>Drag and drop your design here, or click to browse.</p>
                  <input type="file" onChange={handleChatImageUpload} style={{ display: "none" }} id="standard-upload" accept="image/*" />
                  <label htmlFor="standard-upload" className={styles.primaryBtn} style={{ display: "inline-block", cursor: "pointer" }}>
                    Choose File
                  </label>
                </div>
              )}

              {uploadMethod === "whatsapp" && (
                <div style={{ display: "flex", flexDirection: "column", height: "400px", background: "#efeae2", borderRadius: "var(--radius-lg)", overflow: "hidden", border: "1px solid var(--color-outline-variant)", marginTop: "1rem" }}>
                  {/* WhatsApp Header */}
                  <div style={{ background: "#00a884", color: "white", padding: "0.75rem 1rem", display: "flex", alignItems: "center", gap: "1rem" }}>
                    <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", color: "#00a884" }}>
                      <span className="material-symbols-outlined">smart_toy</span>
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: "16px" }}>HIFI AI Bot</div>
                      <div style={{ fontSize: "12px", opacity: 0.9 }}>online</div>
                    </div>
                  </div>
                  
                  {/* WhatsApp Chat Area */}
                  <div style={{ flex: 1, overflowY: "auto", padding: "1rem", display: "flex", flexDirection: "column", gap: "1rem", backgroundImage: "url('/whatsapp_bg.png')", backgroundSize: "cover" }}>
                    <div style={{ textAlign: "center", marginBottom: "0.5rem" }}>
                      <span style={{ background: "#ffeeba", color: "#664d03", fontSize: "11px", padding: "4px 8px", borderRadius: "8px", display: "inline-block" }}>
                        Messages are processed by HIFI AI Bot to automatically attach designs to your order.
                      </span>
                    </div>
                    {chatMessages.map((msg, i) => (
                      <div key={i} style={{ 
                        alignSelf: msg.sender === 'ai' ? 'flex-start' : 'flex-end',
                        maxWidth: '85%',
                        backgroundColor: msg.sender === 'ai' ? '#ffffff' : '#d9fdd3',
                        color: '#111b21',
                        padding: '0.5rem 0.5rem 0.25rem 0.75rem',
                        borderRadius: '8px',
                        borderTopLeftRadius: msg.sender === 'ai' ? '0' : '8px',
                        borderTopRightRadius: msg.sender === 'user' ? '0' : '8px',
                        fontSize: '14.2px',
                        lineHeight: '1.4',
                        boxShadow: '0 1px 0.5px rgba(11,20,26,.13)',
                        position: 'relative'
                      }}>
                        {msg.text && <div style={{ paddingRight: "3rem", paddingBottom: "0.25rem" }}>{msg.text}</div>}
                        {msg.image && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={msg.image} alt="Upload preview" style={{ maxWidth: "100%", borderRadius: "6px", marginTop: msg.text ? "0.25rem" : "0", marginBottom: "0.25rem" }} />
                        )}
                        <div style={{ fontSize: "11px", color: "rgba(17,27,33,0.5)", textAlign: "right", marginTop: "-10px", float: "right" }}>
                          {msg.time} {msg.sender === 'user' && <span className="material-symbols-outlined" style={{ fontSize: "14px", verticalAlign: "middle", marginLeft: "2px", color: "#53bdeb" }}>done_all</span>}
                        </div>
                        <div style={{ clear: "both" }}></div>
                      </div>
                    ))}
                    {isUploading && (
                      <div style={{ alignSelf: 'flex-start', color: '#667781', fontSize: '12px', fontStyle: 'italic', background: 'rgba(255,255,255,0.8)', padding: '4px 8px', borderRadius: '8px' }}>
                        typing...
                      </div>
                    )}
                  </div>

                  {/* WhatsApp Input */}
                  <div style={{ padding: "0.75rem", background: "#f0f2f5", display: "flex", gap: "0.5rem", alignItems: "center" }}>
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      disabled={designState === "received" || isUploading}
                      style={{ 
                        background: "none", border: "none", cursor: designState === "received" ? "not-allowed" : "pointer", 
                        color: "#54656f", display: "flex", alignItems: "center", padding: "0.5rem"
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: "24px" }}>attach_file</span>
                    </button>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      style={{ display: "none" }} 
                      accept="image/*"
                      onChange={handleChatImageUpload}
                    />
                    <input 
                      type="text" 
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && chatInput.trim() && designState !== "received") {
                          setChatMessages(prev => [...prev, { sender: 'user', text: chatInput.trim(), time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) }]);
                          setChatInput("");
                          setTimeout(() => {
                            setChatMessages(prev => [...prev, { sender: 'ai', text: 'Please attach your design image using the paperclip icon so I can process it.', time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) }]);
                          }, 1000);
                        }
                      }}
                      disabled={designState === "received" || isUploading}
                      placeholder={designState === "received" ? "Design approved." : "Type a message"}
                      style={{
                        flex: 1, padding: "0.75rem 1rem", borderRadius: "8px",
                        border: "none", background: "#ffffff",
                        color: "#111b21", fontSize: "15px", outline: "none"
                      }}
                    />
                    <button 
                      disabled={designState === "received" || isUploading || !chatInput.trim()}
                      onClick={() => {
                        if (chatInput.trim() && designState !== "received") {
                          setChatMessages(prev => [...prev, { sender: 'user', text: chatInput.trim(), time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) }]);
                          setChatInput("");
                          setTimeout(() => {
                            setChatMessages(prev => [...prev, { sender: 'ai', text: 'Please attach your design image using the paperclip icon so I can process it.', time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) }]);
                          }, 1000);
                        }
                      }}
                      style={{ 
                        background: (designState === "received" || !chatInput.trim()) ? "transparent" : "#00a884", 
                        border: "none", cursor: (designState === "received" || !chatInput.trim()) ? "default" : "pointer", 
                        color: (designState === "received" || !chatInput.trim()) ? "#54656f" : "#ffffff", 
                        display: "flex", alignItems: "center", justifyContent: "center",
                        width: "40px", height: "40px", borderRadius: "50%"
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>send</span>
                    </button>
                  </div>
                </div>
              )}

              {designState === "received" && uploadMethod === "upload" && (
                <div style={{ padding: "1.5rem", background: "var(--color-surface-container)", borderRadius: "var(--radius-lg)", marginTop: "1rem", display: "flex", alignItems: "center", gap: "1rem" }}>
                  <span className="material-symbols-outlined" style={{ fontSize: "32px", color: "var(--color-primary)" }}>check_circle</span>
                  <div>
                    <div style={{ fontWeight: 600 }}>Design Received</div>
                    <div style={{ fontSize: "14px", color: "var(--color-on-surface-variant)" }}>Reference: {designRef}</div>
                  </div>
                </div>
              )}
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
                      stock: Number(currentVariant?.inventory_count) || undefined,
                      customDesignId: designState === 'received' ? designId : undefined,
                      customDesignReference: designState === 'received' ? designRef : undefined
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
                    stock: Number(currentVariant?.inventory_count) || undefined,
                    customDesignId: designState === 'received' ? designId : undefined,
                    customDesignReference: designState === 'received' ? designRef : undefined,
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
