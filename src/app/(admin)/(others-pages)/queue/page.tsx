"use client";

import { useEffect, useState } from "react";
import ScrambleText from "@/components/nicom/ScrambleText";

type ContentPlanItem = {
  id: string;
  title: string;
  sku: string;
  channel: string;
  brand: string;
  status: string;
  brief: string;
  headline: string;
  last_edited: string;
};

const STATUS_OPTIONS = ["", "In Brief", "Approved", "In Production", "Published", "Rejected"];

export default function QueuePage() {
  const [items, setItems] = useState<ContentPlanItem[]>([]);
  const [filter, setFilter] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    try {
      const url = filter ? `/api/content-plan?status=${encodeURIComponent(filter)}` : "/api/content-plan";
      const res = await fetch(url, { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      setItems(json.items || []);
      setErr(null);
    } catch (e) {
      setErr(String(e));
    }
  }

  useEffect(() => {
    load();
    // load is a stable closure here — listing filter as the only trigger is intentional.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  async function setStatus(item: ContentPlanItem, status: string) {
    setBusy(item.id);
    try {
      const res = await fetch("/api/notion/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ page_id: item.id, status }),
      });
      if (!res.ok) throw new Error(await res.text());
      await load();
    } catch (e) {
      setErr(String(e));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="onyx-eyebrow mb-2">Content Queue · Notion DB</p>
        <h1 style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: "32px", letterSpacing: "-0.3px", color: "var(--color-nicom-text)", marginBottom: "8px" }}>Content Queue</h1>
        <p style={{ color: "var(--color-nicom-muted)", fontSize: "13px" }}>Notion Content Plan · filter by status · approve or reject entries</p>
      </div>
      <div className="onyx-filter-bar">
        <label className="onyx-h3 mb-0 mr-2">Filter:</label>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="onyx-select"
          style={{ width: "auto", cursor: "pointer" }}
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s || "All"}
            </option>
          ))}
        </select>
        <button onClick={load} className="btn-onyx-ghost ml-auto" style={{ cursor: "pointer" }}>
          Refresh
        </button>
      </div>

      {err && (
        <div className="onyx-callout onyx-callout-danger">
          {err}
        </div>
      )}

      <div className="onyx-panel overflow-hidden" style={{ padding: 0 }}>
        <table className="onyx-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>SKU</th>
              <th>Channel</th>
              <th>Brand</th>
              <th>Status</th>
              <th style={{ textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody className="onyx-stagger">
            {items.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", color: "var(--color-nicom-faint)" }}>
                  No entries match this filter.
                </td>
              </tr>
            )}
            {items.map((it) => (
              <tr key={it.id} className="onyx-row">
                <td><ScrambleText text={it.title || "(untitled)"} /></td>
                <td className="mono-cell">{it.sku}</td>
                <td>{it.channel}</td>
                <td>{it.brand}</td>
                <td>
                  <span className="onyx-pill">
                    {it.status || "—"}
                  </span>
                </td>
                <td style={{ textAlign: "right" }}>
                  <div className="flex justify-end gap-2">
                    <button
                      disabled={busy === it.id || !it.sku || !it.channel}
                      onClick={() => {
                        const fmt =
                          {
                            "IG Stories": "ig_stories",
                            "IG Post": "ig_post",
                            "IG Reel": "ig_reel",
                            TikTok: "tiktok",
                          }[it.channel] || "ig_post";
                        window.location.href = `/generate?sku=${encodeURIComponent(
                          it.sku
                        )}&format=${fmt}`;
                      }}
                      className="btn-onyx-primary"
                      style={{ padding: "5px 10px", fontSize: "9.5px" }}
                      title="Trigger generation"
                    >
                      Generate
                    </button>
                    <button
                      disabled={busy === it.id}
                      onClick={() => setStatus(it, "Approved")}
                      className="btn-onyx-success"
                      style={{ padding: "5px 10px", fontSize: "9.5px" }}
                    >
                      Approve
                    </button>
                    <button
                      disabled={busy === it.id}
                      onClick={() => setStatus(it, "Rejected")}
                      className="btn-onyx-danger"
                      style={{ padding: "5px 10px", fontSize: "9.5px" }}
                    >
                      Reject
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
