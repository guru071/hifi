"use client";

import Link from "next/link";
import styles from "./page.module.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useCart } from "@/context/CartContext";

const inr = (n: number) => `₹${Number(n).toFixed(2)}`;

export default function Cart() {
  const { items, updateQuantity, removeItem, totalPrice } = useCart();

  return (
    <>
      <Navbar />
      <main className={styles.main}>
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>Your Cart</h1>
        </div>
        
        <div className={styles.cartLayout}>
          {/* Left Column: Cart Items */}
          <div className={styles.cartItemsArea}>
            {items.length === 0 ? (
              <p>Your cart is empty. <Link href="/shop" style={{color: "var(--color-primary)"}}>Continue shopping</Link></p>
            ) : (
              items.map(item => (
                <div key={item.id} className={styles.cartItem}>
                  <div className={styles.itemImageContainer}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.imageUrl || "https://lh3.googleusercontent.com/aida-public/AEtjO1WX2BasjrqIiFlwF9rlVSal9b0yG54DTBpBRnIu40wMZI876OVUaNyJthIsiXsAT7SJYjy2FEZwghZTUIiykZZT8LOyKb3_WOyMflUX_gqg9lDbp-QkV1sv4jQ2mfp7bO4HjZDQIFLodP4KL6tUfGVb9iFP1laYjBSWJN-ALU0PlX1lN1AQRdT3iszi_GBmN8ZHT9wrP89_2rckJodhb8Qysoz3LNcvfhcayKeWwmexf9rLuEVdiVmKF14"}
                      alt={item.title}
                      className={styles.itemImage}
                    />
                  </div>
                  <div className={styles.itemDetails}>
                    <div>
                      <div className={styles.itemHeaderRow}>
                        <div>
                          <h3 className={styles.itemTitle}>{item.title}</h3>
                          <p className={styles.itemVariantText}>Color: {item.color}</p>
                          <p className={styles.itemVariantText}>Size: {item.size}</p>
                          {item.customDesignReference && (
                            <div className={styles.customDesignStatus}>
                              <span className="material-symbols-outlined" style={{ color: "var(--color-secondary)", fontSize: "14px" }}>design_services</span>
                              <span className={styles.customDesignText}>Design: {item.customDesignReference}</span>
                            </div>
                          )}
                        </div>
                        <div className={styles.itemPrice}>{inr(item.price * item.quantity)}</div>
                      </div>
                    </div>
                    
                    <div className={styles.itemActions}>
                      <div className={styles.quantityControl}>
                        <button className={styles.qtyBtn} onClick={() => updateQuantity(item.id, item.quantity - 1)}>
                          <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>remove</span>
                        </button>
                        <span className={styles.qtyValue}>{item.quantity}</span>
                        <button className={styles.qtyBtn} onClick={() => updateQuantity(item.id, item.quantity + 1)} disabled={!!item.stock && item.quantity >= item.stock}>
                          <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>add</span>
                        </button>
                      </div>
                      
                      <button className={styles.removeBtn} onClick={() => removeItem(item.id)}>
                        <span className={styles.removeText}>Remove</span>
                        <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>close</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          
          {/* Right Column: Summary Panel */}
          <div className={styles.summaryArea}>
            <div className={`${styles.summaryPanel} glass-panel`}>
              <h2 className={styles.summaryTitle}>Summary</h2>
              
              <div className={styles.summaryRows}>
                <div className={styles.summaryRow}>
                  <span className={styles.summaryLabel}>Subtotal</span>
                  <span className={styles.summaryValue}>{inr(totalPrice)}</span>
                </div>
                <div className={styles.summaryRow}>
                  <span className={styles.summaryLabel}>Shipping</span>
                  <span className={styles.summaryLabel} style={{ textAlign: "right" }}>Calculated at next step</span>
                </div>
              </div>
              
              <div className={styles.totalRow}>
                <span className={styles.totalLabel}>Total</span>
                <div className={styles.totalAmountContainer}>
                  <span className={styles.totalAmount}>{inr(totalPrice)}</span>
                  <span className={styles.totalCurrency}>INR</span>
                </div>
              </div>
              
              <Link href="/checkout" style={{ display: "block", pointerEvents: items.length === 0 ? 'none' : 'auto', opacity: items.length === 0 ? 0.5 : 1 }}>
                <button className={styles.checkoutBtn} disabled={items.length === 0}>Secure Checkout</button>
              </Link>
              
              <div className={styles.securityNote}>
                <span className="material-symbols-outlined" style={{ fontSize: "14px", fontVariationSettings: "'FILL' 1" }}>lock</span>
                <span className={styles.securityText}>SSL Encrypted</span>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
