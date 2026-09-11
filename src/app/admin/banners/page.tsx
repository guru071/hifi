"use client";

import React, { useState, useEffect, useRef } from 'react';
import styles from '../page.module.css';

interface Banner {
  id: string;
  image_url: string;
  link_url: string;
}

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  
  const [uploading, setUploading] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");

  useEffect(() => {
    loadBanners();
  }, []);

  async function loadBanners() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/banners");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setBanners(data.banners || []);
    } catch (e: unknown) {
      if (e instanceof Error) setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setMsg("");
    setError("");

    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      
      const newBanner = {
        id: Math.random().toString(36).substr(2, 9),
        image_url: data.url,
        link_url: linkUrl || "/shop"
      };

      const updatedBanners = [...banners, newBanner];
      await saveBanners(updatedBanners);
      setLinkUrl("");
    } catch (e: unknown) {
      if (e instanceof Error) setError(e.message);
    } finally {
      setUploading(false);
    }
  }

  async function removeBanner(id: string) {
    const updated = banners.filter(b => b.id !== id);
    await saveBanners(updated);
  }

  async function saveBanners(updatedBanners: Banner[]) {
    try {
      const res = await fetch("/api/admin/banners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ banners: updatedBanners })
      });
      if (!res.ok) throw new Error("Failed to save banners");
      setBanners(updatedBanners);
      setMsg("Banners updated.");
    } catch (e: unknown) {
      if (e instanceof Error) setError(e.message);
    }
  }

  return (
    <div>
      <header className={styles.header}>
        <div>
          <h2 className={styles.title}>Promotional Banners</h2>
          <p className={styles.subtitle}>Upload offer posters to show on the homepage carousel.</p>
        </div>
      </header>

      {error && <p style={{ color: "var(--color-error)", marginBottom: "1rem" }}>{error}</p>}
      {msg && <p style={{ color: "var(--color-success)", marginBottom: "1rem" }}>{msg}</p>}

      <div className={`glass-panel ${styles.recentOrdersCard}`}>
        <h3 style={{ marginBottom: "1rem" }}>Add New Banner</h3>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <input 
            type="text" 
            placeholder="Link URL (e.g. /shop?category=Sale)" 
            value={linkUrl} 
            onChange={(e) => setLinkUrl(e.target.value)}
            className={styles.input}
            style={{ flex: 1 }}
          />
          <button 
            className={styles.primaryBtn} 
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? "Uploading..." : "Upload Poster Image"}
          </button>
          <input 
            type="file" 
            ref={fileRef} 
            style={{ display: 'none' }} 
            accept="image/*" 
            onChange={handleUpload} 
          />
        </div>
      </div>

      <div style={{ marginTop: "2rem", display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {loading ? <p>Loading banners...</p> : banners.map((b) => (
          <div key={b.id} className={`glass-panel`} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={b.image_url} alt="Banner" style={{ width: "200px", height: "100px", objectFit: "cover", borderRadius: "8px" }} />
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 600 }}>Link: {b.link_url}</p>
            </div>
            <button className={styles.secondaryBtn} onClick={() => removeBanner(b.id)} style={{ color: 'red' }}>Remove</button>
          </div>
        ))}
        {!loading && banners.length === 0 && <p>No banners uploaded yet.</p>}
      </div>
    </div>
  );
}
