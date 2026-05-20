"use client";

import { useEffect, useState } from "react";

type LibraryItem = {
  filename: string;
  sku: string | null;
  format: string | null;
  source: "test-output" | "output";
  size_kb: number;
  modified_at: string;
  modified_ts: number;
  prompt_log: string | null;
  url: string;
};

const FORMATS = ["", "ig_post", "ig_stories", "ig_reel", "tiktok", "carousel", "reels_seed"];

export default function LibraryPage() {
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [err, setErr] = useState<string | null>(null);
  const [sku, setSku] = useState("");
  const [format, setFormat] = useState("");
  const [selected, setSelected] = useState<LibraryItem | null>(null);

  async function load() {
    try {
      const params = new URLSearchParams();
      if (sku) params.set("sku", sku);
      if (format) params.set("format", format);
      params.set("limit", "60");
      const res = await fetch(`/api/library?${params.toString()}`, { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      setItems(json.items || []);
      setTotal(json.total || 0);
      setErr(null);
    } catch (e) {
      setErr(String(e));
    }
  }

  useEffect(() => {
    load();
    const id = setInterval(load, 15000);
    return () => clearInterval(id);
    // load is a stable closure that only depends on sku/format above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sku, format]);

  return (
    <div className="space-y-4">
      <div className="onyx-filter-bar">
        <p className="onyx-eyebrow mb-0 mr-auto" style={{ marginBottom: 0 }}>
          {items.length} of {total} generations · auto-refresh 15s
        </p>
        <input
          placeholder="filter sku…"
          value={sku}
          onChange={(e) => setSku(e.target.value)}
          className="onyx-input"
          style={{ width: "200px" }}
        />
        <select
          value={format}
          onChange={(e) => setFormat(e.target.value)}
          className="onyx-select"
          style={{ width: "160px" }}
        >
          {FORMATS.map((f) => (
            <option key={f} value={f}>
              {f || "all formats"}
            </option>
          ))}
        </select>
        <button onClick={load} className="btn-onyx-ghost">
          Refresh
        </button>
      </div>

      {err && (
        <div className="onyx-callout onyx-callout-danger">
          {err}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {items.map((it) => (
          <button
            key={`${it.source}/${it.filename}`}
            onClick={() => setSelected(it)}
            className="onyx-card-lift"
            style={{
              overflow: "hidden",
              borderRadius: "14px",
              border: "0.5px solid var(--color-nicom-border)",
              background: "var(--color-nicom-surface)",
              textAlign: "left",
              cursor: "pointer",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={it.url}
              alt={it.filename}
              style={{ aspectRatio: "1", width: "100%", objectFit: "cover" }}
              loading="lazy"
            />
            <div style={{ padding: "12px" }}>
              <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-nicom-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {it.sku || it.filename}
              </div>
              <div style={{ marginTop: "4px", display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "10px", color: "var(--color-nicom-faint)" }}>
                <span>{it.format || "—"}</span>
                <span>{it.size_kb} KB</span>
              </div>
              <div style={{ marginTop: "4px", fontSize: "10px", color: "var(--color-nicom-faint)" }}>
                {new Date(it.modified_at).toLocaleString()}
              </div>
            </div>
          </button>
        ))}
        {!items.length && !err && (
          <div
            style={{
              gridColumn: "1 / -1",
              borderRadius: "14px",
              border: "0.5px dashed var(--color-nicom-border)",
              padding: "48px",
              textAlign: "center",
              fontSize: "13px",
              color: "var(--color-nicom-faint)",
            }}
          >
            No generations yet. Run <code className="nicom-mono">scripts/run_pipeline.py</code> or use Generate page.
          </div>
        )}
      </div>

      {/* Lightbox modal */}
      {selected && (
        <div
          className="onyx-modal-backdrop"
          onClick={() => setSelected(null)}
        >
          <div
            className="onyx-modal"
            style={{
              maxHeight: "90vh",
              width: "100%",
              maxWidth: "1100px",
              overflowY: "auto",
              padding: "28px",
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "24px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={selected.url} alt={selected.filename} style={{ width: "100%", borderRadius: "8px" }} />
            <div className="space-y-3" style={{ fontSize: "13px", color: "var(--color-nicom-muted)" }}>
              <h3 style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: "18px", color: "var(--color-nicom-text)", marginBottom: "12px" }}>{selected.filename}</h3>
              <div className="grid grid-cols-2 gap-2" style={{ fontSize: "11px" }}>
                <div style={{ borderRadius: "6px", background: "var(--color-nicom-elev)", padding: "8px", border: "0.5px solid var(--color-nicom-border)" }}>
                  <div style={{ color: "var(--color-nicom-faint)" }}>SKU</div>
                  <div style={{ fontWeight: 600, color: "var(--color-nicom-text)" }}>{selected.sku || "—"}</div>
                </div>
                <div style={{ borderRadius: "6px", background: "var(--color-nicom-elev)", padding: "8px", border: "0.5px solid var(--color-nicom-border)" }}>
                  <div style={{ color: "var(--color-nicom-faint)" }}>Format</div>
                  <div style={{ fontWeight: 600, color: "var(--color-nicom-text)" }}>{selected.format || "—"}</div>
                </div>
                <div style={{ borderRadius: "6px", background: "var(--color-nicom-elev)", padding: "8px", border: "0.5px solid var(--color-nicom-border)" }}>
                  <div style={{ color: "var(--color-nicom-faint)" }}>Size</div>
                  <div style={{ fontWeight: 600, color: "var(--color-nicom-text)" }}>{selected.size_kb} KB</div>
                </div>
                <div style={{ borderRadius: "6px", background: "var(--color-nicom-elev)", padding: "8px", border: "0.5px solid var(--color-nicom-border)" }}>
                  <div style={{ color: "var(--color-nicom-faint)" }}>Source</div>
                  <div style={{ fontWeight: 600, color: "var(--color-nicom-text)" }}>{selected.source}</div>
                </div>
              </div>
              <div style={{ fontSize: "11px", color: "var(--color-nicom-faint)" }}>
                Created: {new Date(selected.modified_at).toLocaleString()}
              </div>
              {selected.prompt_log && (
                <div style={{ fontSize: "11px" }}>
                  <div style={{ marginBottom: "4px", color: "var(--color-nicom-faint)" }}>Prompt log:</div>
                  <code className="nicom-mono" style={{ display: "block", wordBreak: "break-all", borderRadius: "4px", background: "var(--color-nicom-elev)", padding: "8px", color: "var(--color-nicom-faint)" }}>
                    {selected.prompt_log}
                  </code>
                </div>
              )}
              <div className="flex gap-2 pt-2">
                <a
                  href={selected.url}
                  download={selected.filename}
                  className="btn-onyx-primary"
                >
                  Download
                </a>
                <button
                  onClick={() => setSelected(null)}
                  className="btn-onyx-ghost"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
