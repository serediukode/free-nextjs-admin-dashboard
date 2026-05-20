"use client";

import { useEffect, useState } from "react";

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
    return () => clearInterval(id);
  }, []);

  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--color-nicom-faint)]">
        Last 30 generation runs from Notion Generation Log DB. Refreshes every 10s.
      </p>
      {err && (
        <div className="nicom-elev border-l-4 border-[var(--color-danger)] p-3 text-sm text-[var(--color-danger)]">
          {err}
        </div>
      )}
      <div className="nicom-surface overflow-hidden">
        <table className="w-full text-sm">
          <thead className="text-left text-[10px] uppercase tracking-wider text-[var(--color-nicom-faint)]">
            <tr>
              <th className="px-4 py-3 font-medium">Created</th>
              <th className="px-4 py-3 font-medium">SKU</th>
              <th className="px-4 py-3 font-medium">Format</th>
              <th className="px-4 py-3 font-medium">Model</th>
              <th className="px-4 py-3 font-medium text-right">Cost</th>
              <th className="px-4 py-3 font-medium">Compliance</th>
              <th className="px-4 py-3 font-medium">Approved</th>
              <th className="px-4 py-3 font-medium">Output</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-[var(--color-nicom-faint)]">
                  No log entries.
                </td>
              </tr>
            )}
            {items.map((it) => (
              <tr
                key={it.id}
                onClick={() => setSelected(it)}
                className="border-t border-[var(--color-nicom-hairline)] cursor-pointer hover:bg-[var(--color-nicom-elev)] transition-colors"
              >
                <td className="px-4 py-3 nicom-mono text-[var(--color-nicom-faint)]">
                  {new Date(it.created).toLocaleString()}
                </td>
                <td className="px-4 py-3 nicom-mono text-[var(--color-nicom-faint)]">{it.sku}</td>
                <td className="px-4 py-3 nicom-mono text-[var(--color-nicom-faint)]">{it.format}</td>
                <td className="px-4 py-3 nicom-mono text-[var(--color-nicom-faint)]">{it.model}</td>
                <td className="px-4 py-3 text-right nicom-mono text-[var(--color-nicom-text)]">
                  {it.cost_usd !== null ? `$${it.cost_usd.toFixed(4)}` : "—"}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={it.compliance_pass ? "nicom-chip nicom-chip-ok" : "nicom-chip nicom-chip-danger"}
                  >
                    {it.compliance_pass ? "PASS" : "FAIL"}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-[var(--color-ok)]">
                  {it.human_approved ? "✓" : "—"}
                </td>
                <td className="px-4 py-3 text-xs">
                  {it.output_url ? (
                    <a href={it.output_url} target="_blank" className="text-[var(--color-accent)] underline">
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="nicom-surface max-h-[90vh] w-full max-w-3xl overflow-auto p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-[var(--color-nicom-text)]">
                  {selected.title || "(untitled)"}
                </h2>
                <div className="nicom-mono text-[var(--color-nicom-faint)] mt-1">
                  {selected.sku} · {selected.format} · {selected.model}
                </div>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="nicom-elev px-2 py-1 text-sm text-[var(--color-nicom-muted)]"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="bg-[var(--color-nicom-elev)] rounded-lg p-3">
                {selected.output_url ? (
                  <a href={selected.output_url} target="_blank" rel="noreferrer">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={selected.output_url}
                      alt="output"
                      className="max-h-72 w-full rounded object-contain"
                    />
                  </a>
                ) : (
                  <div className="flex h-72 items-center justify-center text-sm text-[var(--color-nicom-faint)]">
                    No output_url
                  </div>
                )}
              </div>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between border-b border-[var(--color-nicom-hairline)] pb-2">
                  <dt className="text-[var(--color-nicom-faint)]">Compliance</dt>
                  <dd>
                    <span
                      className={selected.compliance_pass ? "nicom-chip nicom-chip-ok" : "nicom-chip nicom-chip-danger"}
                    >
                      {selected.compliance_pass ? "PASS" : "FAIL"}
                    </span>
                  </dd>
                </div>
                <div className="flex justify-between border-b border-[var(--color-nicom-hairline)] pb-2">
                  <dt className="text-[var(--color-nicom-faint)]">Human approved</dt>
                  <dd className="text-[var(--color-nicom-text)]">{selected.human_approved ? "✓" : "—"}</dd>
                </div>
                <div className="flex justify-between border-b border-[var(--color-nicom-hairline)] pb-2">
                  <dt className="text-[var(--color-nicom-faint)]">Cost</dt>
                  <dd className="nicom-mono text-[var(--color-nicom-text)]">
                    {selected.cost_usd !== null ? `$${selected.cost_usd.toFixed(4)}` : "—"}
                  </dd>
                </div>
                <div className="flex justify-between border-b border-[var(--color-nicom-hairline)] pb-2">
                  <dt className="text-[var(--color-nicom-faint)]">Created</dt>
                  <dd className="text-[var(--color-nicom-text)] text-xs">
                    {new Date(selected.created).toLocaleString()}
                  </dd>
                </div>
                {selected.notes && (
                  <div>
                    <dt className="text-[var(--color-nicom-faint)]">Notes</dt>
                    <dd className="nicom-elev nicom-mono p-2 mt-1 whitespace-pre-wrap text-xs">
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
                className="rounded bg-[var(--color-accent)] px-3 py-1.5 text-sm font-medium text-white"
              >
                Re-run
              </a>
              <button
                onClick={() => setSelected(null)}
                className="nicom-elev px-3 py-1.5 text-sm text-[var(--color-nicom-muted)]"
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
