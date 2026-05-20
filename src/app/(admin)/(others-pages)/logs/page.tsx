"use client";

import { useEffect, useState } from "react";
import ScrambleText from "@/components/nicom/ScrambleText";

type LogItem = {
  id: string;
  title: string;
  sku: string;
  format: string;
  model: string;
  compliance_pass: boolean;
  human_approved: boolean;
  cost_usd: number | null;
  output_url: string;
  notes: string;
  created: string;
};

export default function LogsPage() {
  const [items, setItems] = useState<LogItem[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [selected, setSelected] = useState<LogItem | null>(null);

  async function load() {
    try {
      const res = await fetch("/api/generation-log", { cache: "no-store" });
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
    const id = setInterval(load, 10000);
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel("nicom-gen-refresh");
      bc.onmessage = (e) => { if (e.data?.type === "generation-complete") setTimeout(load, 3000); };
    } catch {}
    function onStorage(e: StorageEvent) {
      if (e.key === "nicom-last-generation-ts") setTimeout(load, 3000); // Notion write delay
    }
    window.addEventListener("storage", onStorage);
    return () => { clearInterval(id); bc?.close(); window.removeEventListener("storage", onStorage); };
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <p className="onyx-eyebrow mb-2">Generation Log · Notion DB</p>
        <h1 style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: "32px", letterSpacing: "-0.3px", color: "var(--color-nicom-text)", marginBottom: "8px" }}>Generation Log</h1>
        <p style={{ color: "var(--color-nicom-muted)", fontSize: "13px" }}>Last 30 generation runs · Notion Generation Log DB · refresh 10s</p>
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
              <th>Created</th>
              <th>SKU</th>
              <th>Format</th>
              <th>Model</th>
              <th style={{ textAlign: "right" }}>Cost</th>
              <th>Compliance</th>
              <th>Approved</th>
              <th>Output</th>
            </tr>
          </thead>
          <tbody className="onyx-stagger">
            {items.length === 0 && (
              <tr>
                <td colSpan={8} style={{ textAlign: "center", color: "var(--color-nicom-faint)" }}>
                  No log entries.
                </td>
              </tr>
            )}
            {items.map((it) => (
              <tr
                key={it.id}
                className="onyx-row border-t border-[var(--color-nicom-border)]"
                onClick={() => setSelected(it)}
                style={{ cursor: "pointer" }}
              >
                <td className="mono-cell">
                  {new Date(it.created).toLocaleString()}
                </td>
                <td className="mono-cell"><ScrambleText text={it.sku} className="nicom-mono" /></td>
                <td className="mono-cell">{it.format}</td>
                <td className="mono-cell">{it.model}</td>
                <td className="mono-cell" style={{ textAlign: "right", color: "var(--color-nicom-text)" }}>
                  {it.cost_usd !== null ? `$${it.cost_usd.toFixed(4)}` : "—"}
                </td>
                <td>
                  <span className={it.compliance_pass ? "onyx-pill onyx-pill-ok" : "onyx-pill onyx-pill-danger"}>
                    {it.compliance_pass ? "PASS" : "FAIL"}
                  </span>
                </td>
                <td style={{ color: "var(--color-ok)", fontSize: "12px" }}>
                  {it.human_approved ? "✓" : "—"}
                </td>
                <td>
                  {it.output_url ? (
                    <a href={it.output_url} target="_blank" style={{ color: "var(--color-pablo)", textDecoration: "underline", fontSize: "11px" }}>
                      view
                    </a>
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <div
          className="onyx-modal-backdrop"
          onClick={() => setSelected(null)}
        >
          <div
            className="onyx-modal"
            style={{ maxHeight: "90vh", width: "100%", maxWidth: "860px", overflow: "auto", padding: "28px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: "20px", color: "var(--color-nicom-text)", marginBottom: "4px" }}>
                  {selected.title || "(untitled)"}
                </h2>
                <div className="nicom-mono" style={{ color: "var(--color-nicom-faint)", marginTop: "4px" }}>
                  {selected.sku} · {selected.format} · {selected.model}
                </div>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="btn-onyx-ghost"
                style={{ padding: "6px 12px" }}
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div style={{ background: "var(--color-nicom-elev)", borderRadius: "8px", padding: "12px" }}>
                {selected.output_url ? (
                  <a href={selected.output_url} target="_blank" rel="noreferrer">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={selected.output_url}
                      alt="output"
                      style={{ maxHeight: "288px", width: "100%", borderRadius: "6px", objectFit: "contain" }}
                    />
                  </a>
                ) : (
                  <div style={{ display: "flex", height: "288px", alignItems: "center", justifyContent: "center", fontSize: "12px", color: "var(--color-nicom-faint)" }}>
                    No output_url
                  </div>
                )}
              </div>
              <dl className="space-y-2" style={{ fontSize: "13px" }}>
                <div className="flex justify-between pb-2" style={{ borderBottom: "0.5px solid var(--color-nicom-border)" }}>
                  <dt style={{ color: "var(--color-nicom-faint)" }}>Compliance</dt>
                  <dd>
                    <span className={selected.compliance_pass ? "onyx-pill onyx-pill-ok" : "onyx-pill onyx-pill-danger"}>
                      {selected.compliance_pass ? "PASS" : "FAIL"}
                    </span>
                  </dd>
                </div>
                <div className="flex justify-between pb-2" style={{ borderBottom: "0.5px solid var(--color-nicom-border)" }}>
                  <dt style={{ color: "var(--color-nicom-faint)" }}>Human approved</dt>
                  <dd style={{ color: "var(--color-nicom-text)" }}>{selected.human_approved ? "✓" : "—"}</dd>
                </div>
                <div className="flex justify-between pb-2" style={{ borderBottom: "0.5px solid var(--color-nicom-border)" }}>
                  <dt style={{ color: "var(--color-nicom-faint)" }}>Cost</dt>
                  <dd className="nicom-mono" style={{ color: "var(--color-nicom-text)" }}>
                    {selected.cost_usd !== null ? `$${selected.cost_usd.toFixed(4)}` : "—"}
                  </dd>
                </div>
                <div className="flex justify-between pb-2" style={{ borderBottom: "0.5px solid var(--color-nicom-border)" }}>
                  <dt style={{ color: "var(--color-nicom-faint)" }}>Created</dt>
                  <dd style={{ color: "var(--color-nicom-text)", fontSize: "11px" }}>
                    {new Date(selected.created).toLocaleString()}
                  </dd>
                </div>
                {selected.notes && (
                  <div>
                    <dt style={{ color: "var(--color-nicom-faint)" }}>Notes</dt>
                    <dd className="nicom-mono" style={{ background: "var(--color-nicom-elev)", padding: "8px", marginTop: "4px", whiteSpace: "pre-wrap", fontSize: "11px", borderRadius: "4px" }}>
                      {selected.notes}
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <a
                href={`/generate?sku=${encodeURIComponent(selected.sku)}&format=${selected.format
                  .toLowerCase()
                  .replace(/\s+/g, "_")}`}
                className="btn-onyx-primary"
              >
                Re-run
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
      )}
    </div>
  );
}
