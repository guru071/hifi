"use client";

import styles from "./page.module.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ProductCard from "@/components/ui/ProductCard";

import { useEffect, useMemo, useState } from "react";
import type { ProductWithDetails } from "@/lib/services/catalog";

const inr = (n: number) => `₹${Number(n).toFixed(2)}`;

export default function Shop() {
  const [products, setProducts] = useState<ProductWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [maxPrice, setMaxPrice] = useState(0);
  const [sort, setSort] = useState("newest");

  useEffect(() => {
    async function fetchProducts() {
      try {
        const res = await fetch("/api/products");
        if (!res.ok) throw new Error("Failed to fetch products");
        const data = await res.json();
        setProducts(data.products || []);
        const prices = (data.products || []).map((p: ProductWithDetails) => Number(p.base_price));
        if (prices.length) setMaxPrice(Math.ceil(Math.max(...prices)));
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  const allCategories = useMemo(
    () => Array.from(new Set(products.map(p => p.category_name || "Uncategorized").filter(Boolean))).sort(),
    [products]
  );

  const allSizes = useMemo(
    () => Array.from(new Set(
      products.flatMap(p => (p.product_variants || []).map((v) => v.size).filter(Boolean))
    )).sort(),
    [products]
  );

  const filtered = useMemo(() => {
    let list = products.filter(p => {
      const categoryMatch = selectedCategories.length === 0 || selectedCategories.includes(p.category_name || "Uncategorized");
      const text = `${p.title} ${p.subtitle || ""} ${p.description || ""}`.toLowerCase();
      const searchMatch = !search || text.includes(search.toLowerCase());
      const sizeMatch = selectedSizes.length === 0 || (p.product_variants || []).some((v) => selectedSizes.includes(v.size));
      const priceMatch = maxPrice === 0 || Number(p.base_price) <= maxPrice;
      return categoryMatch && searchMatch && sizeMatch && priceMatch;
    });

    switch (sort) {
      case "price-asc":
        list = [...list].sort((a, b) => Number(a.base_price) - Number(b.base_price));
        break;
      case "price-desc":
        list = [...list].sort((a, b) => Number(b.base_price) - Number(a.base_price));
        break;
      case "newest":
      default:
        list = [...list].sort((a, b) => new Date(b.created_at as string).getTime() - new Date(a.created_at as string).getTime());
    }
    return list;
  }, [products, search, selectedCategories, selectedSizes, maxPrice, sort]);

  function toggleIn(list: string[], value: string, setter: (v: string[]) => void) {
    setter(list.includes(value) ? list.filter(v => v !== value) : [...list, value]);
  }

  function isSoldOut(p: ProductWithDetails) {
    return !(p.product_variants || []).some((v) => Number(v.inventory_count) > 0);
  }

  const anyFilter =
    search || selectedCategories.length > 0 || selectedSizes.length > 0 || maxPrice > 0 || sort !== "newest";

  function clearFilters() {
    setSearch("");
    setSelectedCategories([]);
    setSelectedSizes([]);
    setMaxPrice(Math.ceil(Math.max(...products.map(p => Number(p.base_price)), 0)));
    setSort("newest");
  }

  const filterContent = (
    <>
      <div className={styles.filterGroup}>
        <label className={styles.filterLabel} htmlFor="search">Search</label>
        <input
          id="search"
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search products..."
          className={styles.searchInput}
        />
      </div>

      <div className={styles.filterGroup}>
        <h3 className={styles.filterLabel}>Category</h3>
        <div className={styles.categoryList}>
          {allCategories.length === 0 && <span style={{ fontSize: 14 }}>No categories</span>}
          {allCategories.map(cat => (
            <label key={cat} className={styles.checkboxLabel}>
              <input
                type="checkbox"
                className={styles.checkbox}
                checked={selectedCategories.includes(cat)}
                onChange={() => toggleIn(selectedCategories, cat, setSelectedCategories)}
              />
              <span>{cat}</span>
            </label>
          ))}
        </div>
      </div>

      <div className={styles.filterGroup}>
        <h3 className={styles.filterLabel}>Size</h3>
        <div className={styles.sizeGrid}>
          {allSizes.map(size => (
            <button
              key={size}
              className={`${styles.sizeButton} ${selectedSizes.includes(size) ? styles.sizeButtonActive : ""}`}
              onClick={() => toggleIn(selectedSizes, size, setSelectedSizes)}
            >
              {size}
            </button>
          ))}
          {allSizes.length === 0 && <span style={{ fontSize: 14 }}>No sizes</span>}
        </div>
      </div>

      {maxPrice > 0 && (
        <div className={styles.filterGroup}>
          <h3 className={styles.filterLabel}>Max Price: {inr(maxPrice)}</h3>
          <input
            type="range"
            className={styles.priceInput}
            min={0}
            max={Math.max(...products.map(p => Number(p.base_price)), 1)}
            step={50}
            value={maxPrice}
            onChange={e => setMaxPrice(Number(e.target.value))}
          />
          <div className={styles.priceRangeLabels}>
            <span>{inr(0)}</span>
            <span>{inr(Math.max(...products.map(p => Number(p.base_price)), 1))}+</span>
          </div>
        </div>
      )}

      {anyFilter && (
        <button className={styles.clearBtn} onClick={clearFilters}>Clear All Filters</button>
      )}
    </>
  );

  return (
    <>
      <Navbar />
      <main className={styles.main}>
        {/* Sidebar Filters (desktop) */}
        <aside className={styles.sidebar}>
          <div className={`${styles.filterPanel} glass-panel`}>
            <h2 className={styles.filterTitle}>Filters</h2>
            {filterContent}
          </div>
        </aside>

        {/* Mobile Filters */}
        <details className={styles.mobileFilters}>
          <summary>
            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>tune</span>
            Filters {anyFilter ? "(active)" : ""}
          </summary>
          <div className={`glass-panel ${styles.mobileFilterPanel}`}>
            {filterContent}
          </div>
        </details>

        {/* Product Grid Area */}
        <div className={styles.contentArea}>
          <div className={styles.headerRow}>
            <h1 className={styles.pageTitle}>Shop</h1>
            <div className={styles.headerControls}>
              <span className={styles.itemCount}>Showing {filtered.length} of {products.length} items</span>
              <select className={styles.sortSelect} value={sort} onChange={e => setSort(e.target.value)}>
                <option value="newest">Newest</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
              </select>
            </div>
          </div>
          <div className={styles.productGrid}>
            {loading && <p>Loading products...</p>}
            {error && <p>Error: {error}</p>}
            {!loading && !error && filtered.length === 0 && <p>No products match your filters.</p>}
            {!loading && !error && filtered.map((product) => (
              <ProductCard
                key={product.id}
                id={product.id}
                title={product.title}
                subtitle={product.category_name || product.category || "T-Shirt"}
                price={Number(product.base_price)}
                imageUrl={product.image_url as string}
                imageAlt={product.title}
                soldOut={isSoldOut(product)}
                inr
              />
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}