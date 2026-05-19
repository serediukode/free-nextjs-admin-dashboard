"use client";

import { useEffect, useState } from "react";

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
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium">Filter by status:</label>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded border border-gray-200 bg-white px-3 py-1 text-sm dark:border-gray-700 dark:bg-gray-900"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s || "All"}
            </option>
          ))}
        </select>
        <button
          onClick={load}
          className="rounded bg-gray-100 px-3 py-1 text-sm dark:bg-gray-800"
        >
          Refresh
        </button>
      </div>

      {err && <div className="rounded bg-rose-100 p-3 text-sm text-rose-700">{err}</div>}

      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">SKU</th>
              <th className="px-4 py-3">Channel</th>
              <th className="px-4 py-3">Brand</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  No entries match this filter.
                </td>
              </tr>
            )}
            {items.map((it) => (
              <tr key={it.id} className="border-t border-gray-100 dark:border-gray-800">
                <td className="px-4 py-3">{it.title || "(untitled)"}</td>
                <td className="px-4 py-3 font-mono text-xs">{it.sku}</td>
                <td className="px-4 py-3">{it.channel}</td>
                <td className="px-4 py-3">{it.brand}</td>
                <td className="px-4 py-3">
                  <span className="rounded bg-gray-100 px-2 py-0.5 text-xs dark:bg-gray-800">
                    {it.status || "—"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
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
                      className="rounded bg-sky-500 px-2 py-1 text-xs text-white disabled:opacity-50"
                      title="Trigger generation"
                    >
                      Generate
                    </button>
                    <button
                      disabled={busy === it.id}
                      onClick={() => setStatus(it, "Approved")}
                      className="rounded bg-emerald-500 px-2 py-1 text-xs text-white disabled:opacity-50"
                    >
                      Approve
                    </button>
                    <button
                      disabled={busy === it.id}
                      onClick={() => setStatus(it, "Rejected")}
                      className="rounded bg-rose-500 px-2 py-1 text-xs text-white disabled:opacity-50"
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
