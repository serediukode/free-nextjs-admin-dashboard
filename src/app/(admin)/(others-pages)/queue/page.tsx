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
        <label className="text-sm font-medium text-[var(--color-nicom-muted)]">Filter by status:</label>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded border border-[var(--color-nicom-border)] bg-[var(--color-nicom-elev)] px-3 py-1 text-sm text-[var(--color-nicom-text)]"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s || "All"}
            </option>
          ))}
        </select>
        <button
          onClick={load}
          className="nicom-elev px-3 py-1 text-sm text-[var(--color-nicom-muted)] hover:text-[var(--color-nicom-text)] rounded"
        >
          Refresh
        </button>
      </div>

      {err && (
        <div className="nicom-elev border-l-4 border-[var(--color-danger)] p-3 text-sm text-[var(--color-danger)]">
          {err}
        </div>
      )}

      <div className="nicom-surface overflow-hidden">
        <table className="w-full text-sm">
          <thead className="text-left text-[10px] uppercase tracking-wider text-[var(--color-nicom-faint)]">
            <tr>
              <th className="px-4 py-3 font-medium">Title</th>
              <th className="px-4 py-3 font-medium">SKU</th>
              <th className="px-4 py-3 font-medium">Channel</th>
              <th className="px-4 py-3 font-medium">Brand</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-[var(--color-nicom-faint)]">
                  No entries match this filter.
                </td>
              </tr>
            )}
            {items.map((it) => (
              <tr key={it.id} className="border-t border-[var(--color-nicom-hairline)] hover:bg-[var(--color-nicom-elev)] transition-colors">
                <td className="px-4 py-3 text-[var(--color-nicom-muted)]">{it.title || "(untitled)"}</td>
                <td className="px-4 py-3 nicom-mono text-[var(--color-nicom-faint)]">{it.sku}</td>
                <td className="px-4 py-3 text-[var(--color-nicom-muted)]">{it.channel}</td>
                <td className="px-4 py-3 text-[var(--color-nicom-muted)]">{it.brand}</td>
                <td className="px-4 py-3">
                  <span className="nicom-chip">
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
                      className="rounded bg-[var(--color-accent)] px-2 py-1 text-xs text-white disabled:opacity-50"
                      title="Trigger generation"
                    >
                      Generate
                    </button>
                    <button
                      disabled={busy === it.id}
                      onClick={() => setStatus(it, "Approved")}
                      className="rounded bg-[var(--color-ok)] px-2 py-1 text-xs text-white disabled:opacity-50"
                    >
                      Approve
                    </button>
                    <button
                      disabled={busy === it.id}
                      onClick={() => setStatus(it, "Rejected")}
                      className="rounded bg-[var(--color-danger)] px-2 py-1 text-xs text-white disabled:opacity-50"
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
