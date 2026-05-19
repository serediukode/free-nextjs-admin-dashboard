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
      <p className="text-sm text-gray-500">
        Last 30 generation runs from Notion Generation Log DB. Refreshes every 10s.
      </p>
      {err && <div className="rounded bg-rose-100 p-3 text-sm text-rose-700">{err}</div>}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3">SKU</th>
              <th className="px-4 py-3">Format</th>
              <th className="px-4 py-3">Model</th>
              <th className="px-4 py-3 text-right">Cost</th>
              <th className="px-4 py-3">Compliance</th>
              <th className="px-4 py-3">Approved</th>
              <th className="px-4 py-3">Output</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                  No log entries.
                </td>
              </tr>
            )}
            {items.map((it) => (
              <tr
                key={it.id}
                onClick={() => setSelected(it)}
                className="cursor-pointer border-t border-gray-100 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50"
              >
                <td className="px-4 py-3 text-xs text-gray-500">
                  {new Date(it.created).toLocaleString()}
                </td>
                <td className="px-4 py-3 font-mono text-xs">{it.sku}</td>
                <td className="px-4 py-3 font-mono text-xs">{it.format}</td>
                <td className="px-4 py-3 text-xs">{it.model}</td>
                <td className="px-4 py-3 text-right font-mono text-xs">
                  {it.cost_usd !== null ? `$${it.cost_usd.toFixed(4)}` : "—"}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded px-2 py-0.5 text-xs ${
                      it.compliance_pass
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-rose-100 text-rose-700"
                    }`}
                  >
                    {it.compliance_pass ? "PASS" : "FAIL"}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs">{it.human_approved ? "✓" : "—"}</td>
                <td className="px-4 py-3 text-xs">
                  {it.output_url ? (
                    <a href={it.output_url} target="_blank" className="text-sky-600 underline">
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="max-h-[90vh] w-full max-w-3xl overflow-auto rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">{selected.title || "(untitled)"}</h2>
                <div className="mt-1 text-xs text-gray-500">
                  <span className="font-mono">{selected.sku}</span> · {selected.format} ·{" "}
                  {selected.model}
                </div>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="rounded bg-gray-100 px-2 py-1 text-sm dark:bg-gray-800"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
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
                  <div className="flex h-72 items-center justify-center text-sm text-gray-500">
                    No output_url
                  </div>
                )}
              </div>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between border-b border-gray-100 pb-2 dark:border-gray-800">
                  <dt className="text-gray-500">Compliance</dt>
                  <dd>
                    <span
                      className={`rounded px-2 py-0.5 text-xs ${
                        selected.compliance_pass
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-rose-100 text-rose-700"
                      }`}
                    >
                      {selected.compliance_pass ? "PASS" : "FAIL"}
                    </span>
                  </dd>
                </div>
                <div className="flex justify-between border-b border-gray-100 pb-2 dark:border-gray-800">
                  <dt className="text-gray-500">Human approved</dt>
                  <dd>{selected.human_approved ? "✓" : "—"}</dd>
                </div>
                <div className="flex justify-between border-b border-gray-100 pb-2 dark:border-gray-800">
                  <dt className="text-gray-500">Cost</dt>
                  <dd className="font-mono">
                    {selected.cost_usd !== null ? `$${selected.cost_usd.toFixed(4)}` : "—"}
                  </dd>
                </div>
                <div className="flex justify-between border-b border-gray-100 pb-2 dark:border-gray-800">
                  <dt className="text-gray-500">Created</dt>
                  <dd className="text-xs">{new Date(selected.created).toLocaleString()}</dd>
                </div>
                {selected.notes && (
                  <div>
                    <dt className="text-gray-500">Notes</dt>
                    <dd className="mt-1 rounded bg-gray-50 p-2 font-mono text-xs whitespace-pre-wrap dark:bg-gray-800">
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
                className="rounded bg-sky-500 px-3 py-1.5 text-sm font-medium text-white"
              >
                Re-run
              </a>
              <button
                onClick={() => setSelected(null)}
                className="rounded bg-gray-100 px-3 py-1.5 text-sm dark:bg-gray-800"
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
