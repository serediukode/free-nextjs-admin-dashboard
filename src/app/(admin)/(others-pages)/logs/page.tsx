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

  async function load() {
    try {
      const res = await fetch("/api/generation-log", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      setItems(json.items || []);
      setErr(null);
    } catch (e: any) {
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
              <tr key={it.id} className="border-t border-gray-100 dark:border-gray-800">
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
    </div>
  );
}
