"use client";

import React, { useState, useEffect } from "react";
import type { AuditLogWithUser } from "@/lib/supabase/rows";
import styles from "./page.module.css";

export default function AdminAudit() {
  const [logs, setLogs] = useState<AuditLogWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionFilter, setActionFilter] = useState("");

  async function load(action = "") {
    setLoading(true);
    setError("");
    try {
      const q = action ? `?action=${encodeURIComponent(action)}` : "";
      const res = await fetch(`/api/audit${q}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch audit log");
      setLogs(data.auditLogs || []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const initLoad = async () => {
      await load();
    };
    initLoad();
  }, []);

  const actions = Array.from(new Set(logs.map(l => l.action))).sort();

  return (
    <>
      <header className={styles.header}>
        <div>
          <h2 className={styles.title}>Audit Log</h2>
          <p className={styles.subtitle}>Every admin/order/payment mutation, traced.</p>
        </div>
      </header>

      <div className={styles.filterRow}>
        <button className={`${styles.filterChip} ${actionFilter === "" ? styles.filterChipActive : ""}`} onClick={() => { setActionFilter(""); load(""); }}>All ({logs.length})</button>
        {actions.map(a => (
          <button
            key={a}
            className={`${styles.filterChip} ${actionFilter === a ? styles.filterChipActive : ""}`}
            onClick={() => { setActionFilter(a); load(a); }}
          >
            {a}
          </button>
        ))}
      </div>

      {error && <p style={{ color: "var(--color-error)" }}>{error}</p>}
      {loading && <p>Loading audit log...</p>}
      {!loading && logs.length === 0 && <p>No audit events recorded.</p>}

      {!loading && (
        <div className={`glass-panel ${styles.tableCard}`}>
          <div className={styles.tableHead}>
            <span>Timestamp</span>
            <span>Actor</span>
            <span>Action</span>
            <span>Entity</span>
          </div>
          {logs.map(l => (
            <div key={l.id} className={styles.row}>
              <span className={styles.ts}>{new Date(l.created_at || "").toLocaleString()}</span>
              <span>
                <div className={styles.actor}>{l.users?.full_name || l.actor_user_id?.slice(0, 8) || "System"}</div>
                <div className={styles.sub}>{l.users?.email || l.actor_role || ""}</div>
              </span>
              <span className={styles.action}>{l.action}</span>
              <span className={styles.sub}>{l.entity_type}{l.entity_id ? ` · ${l.entity_id.slice(0, 8)}` : ""}</span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}