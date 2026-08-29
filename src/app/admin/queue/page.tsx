"use client";

import React, { useState, useEffect } from "react";
import styles from "./page.module.css";

type CustomDesign = {
  id: string;
  reference_code: string;
  status: string;
  design_image_url?: string;
  media_url?: string;
  notes?: string;
  created_at?: string;
  users?: {
    full_name?: string;
    email?: string;
  };
  sender_phone?: string;
  [key: string]: unknown;
};

export default function CustomQueue() {
  const [designs, setDesigns] = useState<CustomDesign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("received");
  const [busy, setBusy] = useState<string | null>(null);

  async function fetchDesigns() {
    try {
      const res = await fetch("/api/designs", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch designs");
      setDesigns(data.designs || []);
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const initFetch = async () => {
      await fetchDesigns();
    };
    initFetch();
  }, []);

  async function updateStatus(design: CustomDesign, status: string, notes?: string) {
    setBusy(design.id);
    setError("");
    try {
      const res = await fetch(`/api/designs/${design.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, ...(notes ? { notes } : {}) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");
      fetchDesigns();
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
    } finally {
      setBusy(null);
    }
  }

  function requestRevision(design: CustomDesign) {
    const notes = window.prompt("What revision do you need from the customer?");
    if (notes === null) return;
    updateStatus(design, "rejected", notes || "Revision requested");
  }

  const visible = filter === "all" ? designs : designs.filter(d => d.status === filter);
  const pendingCount = designs.filter(d => !['approved', 'rejected'].includes(d.status)).length;

  return (
    <>
      <header className={styles.header}>
        <div>
          <h2 className={styles.title}>Design Queue</h2>
          <p className={styles.subtitle}>
            Review artwork submissions, approve for production, or request revisions.
          </p>
        </div>
        <div className={`glass-panel ${styles.filterPanel}`}>
          <span className={styles.pendingCount}>
            <span className={styles.pendingDot}></span>
            {pendingCount} Awaiting Review
          </span>
        </div>
      </header>

      <div className={styles.filterRow}>
        {["pending", "received", "in_review", "approved", "rejected", "all"].map(sf => (
          <button
            key={sf}
            className={`${styles.filterChip} ${filter === sf ? styles.filterChipActive : ""}`}
            onClick={() => setFilter(sf)}
          >
            {sf}
          </button>
        ))}
      </div>

      {error && <p style={{ color: "var(--color-error)", marginBottom: "1rem" }}>{error}</p>}

      <div className={styles.grid}>
        {loading && <p>Loading designs...</p>}
        {!loading && visible.length === 0 && <p>No designs in this view.</p>}

        {!loading && visible.map((design) => (
          <article key={design.id} className={`glass-panel ${styles.card}`}>
            <div className={styles.imageContainer}>
              {design.design_image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={design.design_image_url} alt={`Design ${design.reference_code}`} className={styles.image} />
              ) : (
                <div className={styles.placeholder}>
                  <span className="material-symbols-outlined" style={{ fontSize: "40px" }}>image</span>
                  <span>No image yet</span>
                </div>
              )}
              <div className={styles.orderBadge}>{design.reference_code}</div>
              {design.sender_phone && (
                <div className={styles.sourceBadge} title={`Sender: ${design.sender_phone}`}>
                  <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>chat</span>
                </div>
              )}
            </div>
            <div className={styles.cardContent}>
              <div className={styles.cardHeaderRow}>
                <div>
                  <h3 className={styles.designTitle}>Status: {design.status}</h3>
                  <p className={styles.clientName}>
                    {design.users?.full_name || "Anonymous"}
                    {design.users?.email && ` · ${design.users.email}`}
                    {design.sender_phone && !design.users && ` · wa ${design.sender_phone}`}
                  </p>
                  <p className={styles.clientName}>{new Date(design.created_at || "").toLocaleString()}</p>
                </div>
                <span className={styles.formatBadge}>Artwork</span>
              </div>
              {design.notes && <p className={styles.notes}>Note: {design.notes}</p>}
              <div className={styles.actionsContainer}>
                {design.status !== 'approved' && (
                  <button className={styles.btnApprove} disabled={busy === design.id} onClick={() => updateStatus(design, 'approved', design.notes)}>
                    Approve
                  </button>
                )}
                {design.status === 'approved' && (
                  <button className={styles.btnRevise} disabled={busy === design.id} onClick={() => requestRevision(design)}>
                    Un-approve
                  </button>
                )}
                {!['approved', 'rejected'].includes(design.status) && (
                  <button className={styles.btnRevise} disabled={busy === design.id} onClick={() => requestRevision(design)}>
                    Request Revision
                  </button>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}