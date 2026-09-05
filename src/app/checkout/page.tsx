"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";

const inr = (n: number) => `₹${Number(n).toFixed(2)}`;

type RazorpayResponse = {
  razorpay_payment_id?: string;
  razorpay_order_id?: string;
  razorpay_signature?: string;
  error?: { description?: string };
};

type RazorpayInstance = {
  open: () => void;
  on: (event: string, callback: (response: RazorpayResponse) => void) => void;
};

type RazorpayConstructor = new (options: Record<string, unknown>) => RazorpayInstance;

type DeliverySettingValue = { type?: string; fee?: number };

type GlobalDeliverySetting = { setting_key: string; setting_value: DeliverySettingValue | null };

export default function Checkout() {
  const { items, totalPrice, clearCart } = useCart();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Redirect to login if not authenticated — user must be logged in to place an order
  useEffect(() => {
    if (!authLoading && user === null) {
      router.replace('/login?next=/checkout');
    }
  }, [authLoading, user, router]);

  const [shippingFee, setShippingFee] = useState(0);
  const [deliveryType, setDeliveryType] = useState('global');
  
  const [designFile, setDesignFile] = useState<File | null>(null);
  const [designPreview, setDesignPreview] = useState<string | null>(null);

  React.useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch("/api/settings");
        if (res.ok) {
          const data = await res.json();
          const settings: GlobalDeliverySetting[] = data.settings || [];
          const globalSettings = settings.find((s) => s.setting_key === 'global_delivery');
          if (globalSettings?.setting_value?.type) {
            setDeliveryType(globalSettings.setting_value.type);
            if (globalSettings.setting_value.type === 'global') {
              setShippingFee(Number(globalSettings.setting_value.fee) || 0);
            }
          }
        }
      } catch (err) {
        console.error(err);
      }
    }
    fetchSettings();
  }, []);

  // Per-product delivery estimate from item metadata
  const perProductEstimate = items.length === 0 ? 0 : items.length * 10;

  const initializeRazorpay = () => {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => reject(new Error("Razorpay SDK failed to load"));
      document.body.appendChild(script);
    });
  };

  const [pendingOrder, setPendingOrder] = useState<{ orderId: string, razorpayOrderId: string, amount: number, currency: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;
    if (!user) {
      setError("Please sign in before placing your order.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      let orderData = pendingOrder;

      // Only create a new order if we don't already have one pending for this session
      if (!orderData) {
        const form = new FormData(e.currentTarget as HTMLFormElement);
        const shippingAddress = {
          full_name: `${form.get("firstName")} ${form.get("lastName")}`.trim(),
          email: String(form.get("email") || ""),
          phone: String(form.get("phone") || ""),
          line1: String(form.get("address") || ""),
          line2: String(form.get("apartment") || "") || null,
          city: String(form.get("city") || ""),
          state: String(form.get("state") || ""),
          postal_code: String(form.get("zip") || ""),
          country: "India",
        };

        const token = user ? await user.getIdToken() : null;

        const res = await fetch("/api/orders", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify({
            shippingAddress,
            items: items.map((it) => ({
              productId: it.productId,
              variantId: it.variantId ?? null,
              quantity: it.quantity,
              customDesignId: it.customDesignId ?? null,
            })),
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to create order");
        if (data.razorpayInitFailed || !data.razorpayOrderId) {
          throw new Error("Payment gateway unavailable. Please try again.");
        }
        orderData = data;
        setPendingOrder(data);
      }

      // Load Razorpay Script
      await initializeRazorpay();

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
        amount: Math.round(orderData!.amount * 100),
        currency: orderData!.currency,
        name: "HIFI Customs",
        description: "Custom apparel order",
        order_id: orderData!.razorpayOrderId,
        handler: async function (response: RazorpayResponse) {
          try {
              const token = user ? await user.getIdToken() : null;
              const formData = new FormData();
              formData.append("razorpay_payment_id", response.razorpay_payment_id || "");
              formData.append("razorpay_order_id", response.razorpay_order_id || "");
              formData.append("razorpay_signature", response.razorpay_signature || "");
              formData.append("orderId", orderData!.orderId);
              if (designFile) {
                formData.append("design_file", designFile);
              }

              const verifyRes = await fetch("/api/payments/verify", {
                method: "POST",
                headers: { 
                  ...(token ? { Authorization: `Bearer ${token}` } : {})
                  // Note: Do not set Content-Type for FormData, browser sets it automatically with boundary
                },
                body: formData,
            });
            const verifyData = await verifyRes.json();
            if (!verifyRes.ok) throw new Error(verifyData.error || "Verification failed");

            clearCart();
            router.push(`/order/${orderData!.orderId}`);
          } catch (err) {
            setError((err as Error).message || "Payment verification failed");
            setLoading(false);
          }
        },
        prefill: {
          name: (user?.displayName as string) || "",
          email: user?.email || "",
          contact: "",
        },
        theme: { color: "#000000" },
        modal: {
          ondismiss: function () {
            setError("Payment cancelled. You can retry by clicking 'Complete Order' again.");
            setLoading(false);
          }
        },
      };

      const paymentObject = new (window as unknown as { Razorpay: RazorpayConstructor }).Razorpay(options);
      paymentObject.on("payment.failed", function (response: RazorpayResponse) {
        setError(response.error?.description || "Payment failed");
        setLoading(false);
      });
      paymentObject.open();
    } catch (err) {
      setError((err as Error).message || "Something went wrong");
      setLoading(false);
    }
  };

  const estimate = deliveryType === 'global' ? shippingFee : perProductEstimate;

  return (
    <>
      <Navbar />
      <main className={styles.main}>
        <div className={styles.checkoutLayout}>
          {/* Left Column - Form */}
          <div className={styles.formColumn}>
            <div className={styles.breadcrumbs}>
              <div className={styles.stepActive}>
                <div className={styles.stepNumberActive}>1</div>
                Shipping
              </div>
              <div className={styles.divider}></div>
              <div className={styles.stepInactive}>
                <div className={styles.stepNumberInactive}>2</div>
                Method
              </div>
              <div className={styles.divider}></div>
              <div className={styles.stepInactive}>
                <div className={styles.stepNumberInactive}>3</div>
                Payment
              </div>
            </div>

            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Shipping Information</h2>
                <p className={styles.sectionSubtitle}>Where should we send your order?</p>
              </div>

              {error && <div style={{ color: "var(--color-error)", marginBottom: "1rem" }}>{error}</div>}

              <form className={styles.form} onSubmit={handleSubmit}>
                <div className={`${styles.formRow} ${styles.formRow2Col}`}>
                  <div>
                    <input type="text" id="firstName" name="firstName" placeholder="First Name" required className={styles.inputField} />
                  </div>
                  <div>
                    <input type="text" id="lastName" name="lastName" placeholder="Last Name" required className={styles.inputField} />
                  </div>
                </div>

                <div>
                  <input type="email" id="email" name="email" placeholder="Email Address" required defaultValue={user?.email || ""} className={styles.inputField} />
                </div>

                <div>
                  <input type="text" id="address" name="address" placeholder="Street Address" required className={styles.inputField} />
                </div>

                <div>
                  <input type="text" id="apartment" name="apartment" placeholder="Apartment, suite, etc. (optional)" className={styles.inputField} />
                </div>

                <div className={`${styles.formRow} ${styles.formRow3Col}`}>
                  <div>
                    <input type="text" id="city" name="city" placeholder="City" required className={styles.inputField} />
                  </div>
                  <div>
                    <input type="text" id="state" name="state" placeholder="State" required className={styles.inputField} />
                  </div>
                  <div>
                    <input type="text" id="zip" name="zip" placeholder="PIN Code" required className={styles.inputField} />
                  </div>
                </div>

                <div>
                  <input type="tel" id="phone" name="phone" placeholder="Phone Number (for shipping updates)" required className={styles.inputField} />
                </div>

                {/* Custom Design Upload */}
                <div className={styles.sectionHeader} style={{ marginTop: '2rem', marginBottom: '1rem' }}>
                  <h3 className={styles.sectionTitle} style={{ fontSize: '1.1rem' }}>Custom Design (Optional)</h3>
                  <p className={styles.sectionSubtitle}>Upload a design for your custom items. It will be securely stored once your order is confirmed.</p>
                </div>
                <div style={{ marginBottom: '1.5rem', padding: '1.5rem', border: '1px dashed var(--color-outline-variant)', borderRadius: 'var(--radius-lg)', textAlign: 'center' }}>
                  {!designPreview ? (
                    <>
                      <span className="material-symbols-outlined" style={{ fontSize: "32px", color: "var(--color-outline)" }}>cloud_upload</span>
                      <p style={{ margin: "0.5rem 0", color: "var(--color-on-surface-variant)", fontSize: "14px" }}>Click below to choose a design image.</p>
                      <input type="file" id="design-upload" accept="image/*" style={{ display: "none" }} onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          const file = e.target.files[0];
                          setDesignFile(file);
                          setDesignPreview(URL.createObjectURL(file));
                        }
                      }} />
                      <label htmlFor="design-upload" className={styles.secondaryBtn} style={{ display: "inline-block", cursor: "pointer", padding: "0.5rem 1rem", marginTop: "0.5rem" }}>
                        Browse Files
                      </label>
                    </>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={designPreview} alt="Design Preview" style={{ maxWidth: "200px", maxHeight: "200px", borderRadius: "var(--radius-sm)" }} />
                      <button type="button" className={styles.secondaryBtn} onClick={() => { setDesignFile(null); setDesignPreview(null); }}>Remove Design</button>
                    </div>
                  )}
                </div>

                <div className={styles.submitBtnContainer}>
                  <button type="submit" className={styles.submitBtn} disabled={loading || items.length === 0}>
                    {loading ? "Processing..." : "Complete Order"}
                    <span className={`material-symbols-outlined ${styles.arrowIcon}`}>arrow_forward</span>
                  </button>
                </div>
              </form>
            </section>
          </div>

          {/* Right Column - Order Summary */}
          <div className={styles.summaryColumn}>
            <div className={`${styles.summaryPanel} glass-panel`}>
              <h3 className={styles.summaryTitle}>Order Summary</h3>

              <div className={styles.itemList}>
                {items.length === 0 ? (
                  <p>Your cart is empty.</p>
                ) : (
                  items.map(item => (
                    <div key={item.id} className={styles.summaryItem}>
                      <div className={styles.itemImageContainer}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          className={styles.itemImage}
                        />
                        <div className={styles.itemBadge}>{item.quantity}</div>
                      </div>
                      <div className={styles.itemInfo}>
                        <h4 className={styles.itemTitle}>{item.title}</h4>
                        <p className={styles.itemVariant}>
                          Color: {item.color} <br />
                          Size: {item.size}
                          {item.customDesignReference && (
                            <><br />Design: {item.customDesignReference}</>
                          )}
                        </p>
                        <p className={styles.itemPrice}>{inr(item.price * item.quantity)}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className={styles.costBreakdown}>
                <div className={styles.costRow}>
                  <span>Subtotal</span>
                  <span>{inr(totalPrice)}</span>
                </div>
                <div className={styles.costRow}>
                  <span>Shipping</span>
                  <span>{inr(estimate)}</span>
                </div>
              </div>

              <div className={styles.totalRow}>
                <span className={styles.totalLabel}>Total</span>
                <div className={styles.totalAmountContainer}>
                  <span className={styles.totalCurrency}>INR</span>
                  <span className={styles.totalAmount}>{inr(totalPrice + estimate)}</span>
                </div>
              </div>

              <div className={styles.trustBadges}>
                <span className="material-symbols-outlined" title="Secure Payment">lock</span>
                <span className="material-symbols-outlined" title="Verified">verified_user</span>
                <span className="material-symbols-outlined" title="Encrypted">shield</span>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
