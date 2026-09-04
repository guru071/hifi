"use client";

import React, { useState, useEffect } from "react";
import styles from "./page.module.css";

type InventoryItem = {
  id: string;
  product_id: string;
  inventory_count: number;
  productId: string;
  productTitle: string;
  basePrice: number;
  deliveryFee: number;
  imageUrl: string;
  sku?: string;
  color?: string;
  size?: string;
  [key: string]: unknown;
};

export default function InventoryManagement() {
  const [isGlobalDelivery, setIsGlobalDelivery] = useState(false);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch products
        const res = await fetch("/api/products");
        if (!res.ok) throw new Error("Failed to fetch products");
        const data = await res.json();
        
        const flattened = [];
        for (const product of data.products) {
          if (product.product_variants) {
for (const variant of product.product_variants) {
              flattened.push({
                ...variant,
                inventory_count: Number(variant.inventory_count) || 0,
                productId: product.id,
                productTitle: product.title,
                basePrice: product.base_price,
                deliveryFee: product.delivery_fee,
                imageUrl: product.image_url || "",
              });
            }
          }
        }
        setInventory(flattened);

        // Fetch settings
        const settingsRes = await fetch("/api/settings");
        if (settingsRes.ok) {
          const settingsData = await settingsRes.json();
          const globalSettings = settingsData.settings.find((s: { setting_key: string; setting_value: { type: string; fee?: number; free_shipping_threshold?: number } }) => s.setting_key === 'global_delivery');
          if (globalSettings) {
            setIsGlobalDelivery(globalSettings.setting_value.type === 'global');
            // Store global fee in state if needed, omitting for brevity
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleToggleGlobalDelivery = async () => {
    const newValue = !isGlobalDelivery;
    setIsGlobalDelivery(newValue);
    try {
      await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          key: 'global_delivery', 
          value: { type: newValue ? 'global' : 'per_product', fee: 15.00, free_shipping_threshold: 150.00 } 
        })
      });
    } catch (err) {
      console.error("Failed to save setting", err);
    }
  };

  return (
    <>
      <header className={styles.header}>
        <div>
          <h2 className={styles.title}>Inventory Management</h2>
          <p className={styles.subtitle}>Manage product variants, stock levels, and delivery configuration.</p>
        </div>

        {/* Glass Search & Filters */}
        <div className={`glass-panel ${styles.controlsBar}`}>
          <div className={styles.searchWrapper}>
            <span className={`material-symbols-outlined ${styles.searchIcon}`}>search</span>
            <input 
              type="text" 
              className={styles.searchInput} 
              placeholder="Search products, SKUs, or tags..." 
            />
          </div>
          <div className={styles.actionButtons}>
            <button className={styles.btnSecondary}>
              <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>filter_list</span>
              Category
            </button>
            <button className={styles.btnSecondary}>
              <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>inventory_2</span>
              Stock Status
            </button>
            <button className={styles.btnPrimary}>
              <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>download</span>
              Export
            </button>
          </div>
        </div>
      </header>

      {/* Delivery Settings Section */}
      <section className={`glass-panel ${styles.deliverySettings}`}>
        <div className={styles.deliveryHeaderRow}>
          <div>
            <h3 className={styles.deliveryTitle}>
              <span className="material-symbols-outlined">local_shipping</span>
              Delivery Settings
            </h3>
            <p className={styles.subtitle} style={{ fontSize: "14px" }}>
              Configure how delivery fees are applied across your inventory.
            </p>
          </div>
          <div className={styles.deliveryTogglePanel}>
            <span className={`${styles.toggleLabel} ${!isGlobalDelivery ? styles.toggleLabelActive : styles.toggleLabelInactive}`}>
              Per Product Fee
            </span>
            
            <label className={styles.switch}>
              <input 
                type="checkbox" 
                checked={isGlobalDelivery} 
                onChange={handleToggleGlobalDelivery} 
              />
              <span className={styles.slider}></span>
            </label>
            
            <span className={`${styles.toggleLabel} ${isGlobalDelivery ? styles.toggleLabelActive : styles.toggleLabelInactive}`}>
              Global Fee
            </span>
          </div>
        </div>

        {/* Global Fee Input */}
        <div className={`${styles.globalFeeArea} ${isGlobalDelivery ? styles.globalFeeVisible : styles.globalFeeHidden}`}>
          <label className={styles.toggleLabelActive} style={{ fontSize: "12px", fontWeight: 600, textTransform: "uppercase" }}>
            Global Standard Rate:
          </label>
          <div className={styles.globalFeeInputWrapper}>
            <span className={styles.currencySymbol}>₹</span>
            <input 
              type="number" 
              className={styles.globalFeeInput} 
              defaultValue="15.00" 
              onBlur={async (e) => {
                const newFee = parseFloat(e.target.value);
                if (isNaN(newFee)) return;
                try {
                  await fetch("/api/settings", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ 
                      key: 'global_delivery', 
                      value: { type: isGlobalDelivery ? 'global' : 'per_product', fee: newFee, free_shipping_threshold: 150.00 } 
                    })
                  });
                } catch (err) {
                  console.error(err);
                }
              }}
            />
          </div>
        </div>
      </section>

      {/* Inventory Data Table */}
      <section className={`glass-panel ${styles.tableSection}`}>
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th} style={{ width: "3rem" }}>
                  <input type="checkbox" />
                </th>
                <th className={styles.th}>Product</th>
                <th className={styles.th}>SKU</th>
                <th className={styles.th}>Variant</th>
                <th className={styles.th} style={{ textAlign: "right" }}>Stock</th>
                <th className={styles.th} style={{ textAlign: "right" }}>Price</th>
                <th className={styles.th} style={{ textAlign: "right" }}>Delivery Fee</th>
                <th className={styles.th} style={{ textAlign: "center" }}>Status</th>
                <th className={styles.th}></th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={9} style={{textAlign: "center", padding: "2rem"}}>Loading inventory...</td></tr>}
              {!loading && inventory.length === 0 && <tr><td colSpan={9} style={{textAlign: "center", padding: "2rem"}}>No variants found.</td></tr>}
              {!loading && inventory.map((item) => (
                <tr key={item.id} className={styles.tr}>
                  <td className={styles.td}>
                    <input type="checkbox" />
                  </td>
                  <td className={styles.td}>
                    <div className={styles.productInfo}>
                      <div className={styles.productImage}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={item.imageUrl} alt={item.productTitle} />
                      </div>
                      <span className={styles.productTitle}>{item.productTitle}</span>
                    </div>
                  </td>
                  <td className={`${styles.td} ${styles.sku}`}>{item.sku}</td>
                  <td className={styles.td}>
                    <div className={styles.variantInfo}>
                      <span className={styles.colorSwatch} style={{ backgroundColor: (item.color || '').toLowerCase() === 'bone' ? '#f5f5dc' : (item.color || '').toLowerCase() }}></span>
                      {item.color} / {item.size}
                    </div>
                  </td>
                  <td className={styles.td} style={{ textAlign: "right" }}>
                    <div className={styles.stockInfo}>
                      <span className={`${styles.stockDot} ${item.inventory_count > 10 ? styles.stockHealthy : (item.inventory_count > 0 ? styles.stockLow : styles.stockOut)}`}></span>
                      {item.inventory_count > 10 ? item.inventory_count : <span className={styles.stockTextLow}>{item.inventory_count}</span>}
                    </div>
                  </td>
                  <td className={styles.td} style={{ textAlign: "right" }}>₹{Number(item.basePrice).toFixed(2)}</td>
                  <td className={styles.td} style={{ textAlign: "right" }}>
                    <div className={styles.feeInputWrapper}>
                      <span className={styles.currencySymbol} style={{ fontSize: "14px" }}>₹</span>
                      <input 
                        type="number" 
                        className={styles.feeInput} 
                        defaultValue={item.deliveryFee != null ? Number(item.deliveryFee).toFixed(2) : "0.00"} 
                        disabled={isGlobalDelivery}
                        onBlur={async (e) => {
                          const newFee = parseFloat(e.target.value);
                          if (isNaN(newFee)) return;
                          try {
                            await fetch(`/api/products/${item.productId}`, {
                              method: "PUT",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ delivery_fee: newFee })
                            });
                          } catch (err) {
                            console.error(err);
                          }
                        }}
                      />
                    </div>
                  </td>
                  <td className={styles.td} style={{ textAlign: "center" }}>
                    {item.inventory_count > 10 ? (
                      <span className={`${styles.statusBadge} ${styles.statusInStock}`}>In Stock</span>
                    ) : item.inventory_count > 0 ? (
                      <span className={`${styles.statusBadge} ${styles.statusLowStock}`}>Low Stock</span>
                    ) : (
                      <span className={`${styles.statusBadge} ${styles.statusOutStock}`}>Out of Stock</span>
                    )}
                  </td>
                  <td className={styles.td} style={{ textAlign: "right" }}>
                    <button style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-on-surface-variant)" }}>
                      <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>more_vert</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className={styles.tableFooter}>
          <span>Showing {inventory.length} items</span>
        </div>
      </section>
    </>
  );
}
