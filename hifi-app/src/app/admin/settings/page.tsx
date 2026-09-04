"use client";

import React, { useState, useEffect } from "react";
import styles from "./page.module.css";

export default function AdminSettings() {
  const [settings, setSettings] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch("/api/settings");
        if (!res.ok) throw new Error("Failed to fetch settings");
        const data = await res.json();
        const settingsMap: Record<string, unknown> = {};
        data.settings.forEach((s: { setting_key: string; setting_value: unknown }) => {
          settingsMap[s.setting_key] = s.setting_value;
        });
        setSettings(settingsMap);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  const handleSave = async (key: string, value: unknown) => {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value })
      });
      if (!res.ok) throw new Error("Failed to save setting");
      alert("Settings saved successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to save setting");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <>
        <header className={styles.header}>
          <div>
            <h2 className={styles.title}>Settings</h2>
            <p className={styles.subtitle}>Loading configuration...</p>
          </div>
        </header>
      </>
    );
  }

  const storeDetails = (settings.store_details as { name: string; email: string; description: string }) || {
    name: "HIFI Premium Customs",
    email: "support@hificustoms.com",
    description: "Premium heavyweight blanks and custom apparel design."
  };

  const whatsappConfig = (settings.whatsapp_config as { phoneNumberId: string; token: string }) || {
    phoneNumberId: "123456789012345",
    token: ""
  };

  const globalDelivery = (settings.global_delivery as { type: string; fee: number; free_shipping_threshold: number }) || { type: "global", fee: 15, free_shipping_threshold: 150 };

  return (
    <>
      <header className={styles.header}>
        <div>
          <h2 className={styles.title}>Settings</h2>
          <p className={styles.subtitle}>Configure global store preferences and integrations.</p>
        </div>
      </header>

      <div className={styles.contentGrid}>
        {/* Settings Navigation */}
        <div className={styles.settingsNav}>
          <div className={`${styles.navItem} ${styles.navItemActive}`}>
            <span className="material-symbols-outlined">storefront</span>
            Store Details
          </div>
          <div className={`${styles.navItem} ${styles.navItemInactive}`}>
            <span className="material-symbols-outlined">payments</span>
            Payments (Razorpay)
          </div>
          <div className={`${styles.navItem} ${styles.navItemInactive}`}>
            <span className="material-symbols-outlined">chat</span>
            WhatsApp Integration
          </div>
          <div className={`${styles.navItem} ${styles.navItemInactive}`}>
            <span className="material-symbols-outlined">admin_panel_settings</span>
            Team & Permissions
          </div>
        </div>

        {/* Settings Content */}
        <div className={styles.settingsContent}>
          
          <section className={`glass-panel ${styles.sectionCard}`}>
            <h3 className={styles.sectionTitle}>General Information</h3>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              handleSave('store_details', {
                name: formData.get('name'),
                email: formData.get('email'),
                description: formData.get('description')
              });
            }}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Store Name</label>
                <input type="text" name="name" className={styles.input} defaultValue={storeDetails.name} />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Contact Email</label>
                <input type="email" name="email" className={styles.input} defaultValue={storeDetails.email} />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Store Description</label>
                <textarea 
                  name="description"
                  className={`${styles.input} ${styles.textarea}`} 
                  defaultValue={storeDetails.description} 
                />
              </div>
              
              <button type="submit" className={styles.btnPrimary} disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </form>
          </section>

          <section className={`glass-panel ${styles.sectionCard}`}>
            <h3 className={styles.sectionTitle}>Delivery Fees</h3>
            <p className={styles.hint}>GLOBAL applies one fee to every order; PER_PRODUCT sums each product&apos;s delivery_fee. Free shipping kicks in above the threshold.</p>

            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              handleSave('global_delivery', {
                type: formData.get('mode'),
                fee: Number(formData.get('fee')),
                free_shipping_threshold: Number(formData.get('threshold')),
              });
            }}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Delivery Mode</label>
                <select name="mode" className={styles.input} defaultValue={globalDelivery.type}>
                  <option value="global">GLOBAL (flat fee)</option>
                  <option value="per_product">PER_PRODUCT (sum of product fees)</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Flat Delivery Fee (INR)</label>
                <input type="number" min="0" step="0.01" name="fee" className={styles.input} defaultValue={Number(globalDelivery.fee)} />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Free Shipping Threshold (INR)</label>
                <input type="number" min="0" step="0.01" name="threshold" className={styles.input} defaultValue={Number(globalDelivery.free_shipping_threshold)} />
              </div>

              <button type="submit" className={styles.btnPrimary} disabled={saving} style={{ marginTop: "1rem" }}>
                {saving ? "Saving..." : "Save Delivery Settings"}
              </button>
            </form>
          </section>

          <section className={`glass-panel ${styles.sectionCard}`}>
            <h3 className={styles.sectionTitle}>WhatsApp Configuration</h3>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              handleSave('whatsapp_config', {
                phoneNumberId: formData.get('phoneNumberId'),
                token: formData.get('token')
              });
            }}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Business Phone Number ID</label>
                <input type="text" name="phoneNumberId" className={styles.input} defaultValue={whatsappConfig.phoneNumberId} />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>System User Token</label>
                <input type="password" name="token" className={styles.input} defaultValue={whatsappConfig.token} placeholder="••••••••••••••••••••••••••••••" />
              </div>

              <button type="submit" className={styles.btnPrimary} disabled={saving}>
                {saving ? "Updating..." : "Update Integration"}
              </button>
            </form>
          </section>

        </div>
      </div>
    </>
  );
}
