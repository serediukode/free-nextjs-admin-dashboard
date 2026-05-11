"use client";

import { useEffect, useState } from "react";

type Item = {
  id: string;
  title: string;
  sku: string;
  channel: string;
  brand: string;
  status: string;
  brief: string;
  headline: string;
  date: string;
};

const STATUS_COLOR: Record<string, string> = {
  "In Brief": "bg-amber-200 text-amber-900",
  Approved: "bg-emerald-200 text-emerald-900",
  "In Production": "bg-sky-200 text-sky-900",
  Published: "bg-indigo-200 text-indigo-900",
  Rejected: "bg-rose-200 text-rose-900",
  "Legacy v1": "bg-gray-200 text-gray-700",
};

const BRAND_BORDER: Record<string, string> = {
  "VIKA Main": "border-l-4 border-blue-500",
  "VIKA Slim": "border-l-4 border-pink-500",
  SBR: "border-l-4 border-gray-500",
  Pablo: "border-l-4 border-purple-500",
};

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function daysInMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}

export default function ContentPlanCalendar() {
  const [items, setItems] = useState<Item[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()));
  const [selected, setSelected] = useState<Item | null>(null);

  useEffect(() => {
    fetch("/api/content-plan", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => setItems(j.items || []))
      .catch((e) => setErr(String(e)));
  }, []);

  // group items by YYYY-MM-DD
  const byDate = new Map<string, Item[]>();
  for (const it of items) {
    if (!it.date) continue;
    const key = it.date.slice(0, 10);
    if (!byDate.has(key)) byDate.set(key, []);
    byDate.get(key)!.push(it);
  }

  const total = daysInMonth(cursor);
  const firstDay = cursor.getDay(); // 0=Sun
  const offset = (firstDay + 6) % 7; // make Mon=0
  const cells: { date: Date | null; iso: string }[] = [];
  for (let i = 0; i < offset; i++) cells.push({ date: null, iso: "" });
  for (let d = 1; d <= total; d++) {
    const date = new Date(cursor.getFullYear(), cursor.getMonth(), d);
    cells.push({ date, iso: date.toISOString().slice(0, 10) });
  }
  while (cells.length % 7 !== 0) cells.push({ date: null, iso: "" });

  const monthLabel = cursor.toLocaleString("default", { month: "long", year: "numeric" });
  const undated = items.filter((it) => !it.date).length;

  return (
    <div className="space-y-4">
      {err && <div className="rounded bg-rose-100 p-3 text-sm text-rose-700">{err}</div>}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
            className="rounded bg-gray-100 px-3 py-1 text-sm dark:bg-gray-800"
          >
            ←
          </button>
          <div className="min-w-[180px] text-center text-lg font-semibold capitalize">
            {monthLabel}
          </div>
          <button
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
            className="rounded bg-gray-100 px-3 py-1 text-sm dark:bg-gray-800"
          >
            →
          </button>
          <button
            onClick={() => setCursor(startOfMonth(new Date()))}
            className="rounded bg-emerald-500 px-3 py-1 text-sm text-white"
          >
            Today
          </button>
        </div>
        <div className="text-xs text-gray-500">
          {items.length} entries · {undated} undated
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="grid grid-cols-7 border-b border-gray-100 text-xs uppercase tracking-wide text-gray-500 dark:border-gray-800">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
            <div key={d} className="border-r border-gray-100 px-2 py-2 last:border-r-0 dark:border-gray-800">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((cell, i) => {
            const today = cell.iso === new Date().toISOString().slice(0, 10);
            const events = byDate.get(cell.iso) || [];
            return (
              <div
                key={i}
                className={`min-h-[110px] border-b border-r border-gray-100 p-1 last-col:border-r-0 dark:border-gray-800 ${
                  cell.date ? "" : "bg-gray-50/50 dark:bg-gray-800/30"
                } ${today ? "bg-emerald-50/40 dark:bg-emerald-900/10" : ""}`}
              >
                {cell.date && (
                  <div className="mb-1 text-xs text-gray-500">{cell.date.getDate()}</div>
                )}
                <div className="space-y-1">
                  {events.slice(0, 4).map((it) => (
                    <button
                      key={it.id}
                      onClick={() => setSelected(it)}
                      className={`block w-full truncate rounded px-1.5 py-0.5 text-left text-[11px] hover:opacity-90 ${
                        STATUS_COLOR[it.status] || "bg-gray-100 text-gray-700"
                      } ${BRAND_BORDER[it.brand] || ""}`}
                      title={`${it.brand} · ${it.channel} · ${it.status}`}
                    >
                      {it.title || it.sku || "(untitled)"}
                    </button>
                  ))}
                  {events.length > 4 && (
                    <div className="px-1 text-[10px] text-gray-500">+{events.length - 4} more</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="max-h-[90vh] w-full max-w-xl overflow-auto rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <h2 className="text-lg font-semibold">{selected.title || "(untitled)"}</h2>
              <button
                onClick={() => setSelected(null)}
                className="rounded bg-gray-100 px-2 py-1 text-sm dark:bg-gray-800"
              >
                ×
              </button>
            </div>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between border-b border-gray-100 pb-2 dark:border-gray-800">
                <dt className="text-gray-500">SKU</dt>
                <dd className="font-mono">{selected.sku}</dd>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-2 dark:border-gray-800">
                <dt className="text-gray-500">Channel</dt>
                <dd>{selected.channel}</dd>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-2 dark:border-gray-800">
                <dt className="text-gray-500">Brand</dt>
                <dd>{selected.brand}</dd>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-2 dark:border-gray-800">
                <dt className="text-gray-500">Status</dt>
                <dd>
                  <span
                    className={`rounded px-2 py-0.5 text-xs ${
                      STATUS_COLOR[selected.status] || "bg-gray-100"
                    }`}
                  >
                    {selected.status || "—"}
                  </span>
                </dd>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-2 dark:border-gray-800">
                <dt className="text-gray-500">Date</dt>
                <dd>{selected.date}</dd>
              </div>
              {selected.headline && (
                <div>
                  <dt className="text-gray-500">Headline UA</dt>
                  <dd className="mt-1 rounded bg-gray-50 p-2 text-sm dark:bg-gray-800">
                    {selected.headline}
                  </dd>
                </div>
              )}
              {selected.brief && (
                <div>
                  <dt className="text-gray-500">Brief</dt>
                  <dd className="mt-1 max-h-40 overflow-auto rounded bg-gray-50 p-2 text-sm dark:bg-gray-800">
                    {selected.brief}
                  </dd>
                </div>
              )}
            </dl>
            <div className="mt-4 flex justify-end gap-2">
              <a
                href={`/generate?sku=${encodeURIComponent(selected.sku)}&format=${(
                  {
                    "IG Stories": "ig_stories",
                    "IG Post": "ig_post",
                    "IG Reel": "ig_reel",
                    TikTok: "tiktok",
                  }[selected.channel] || "ig_post"
                )}`}
                className="rounded bg-sky-500 px-3 py-1.5 text-sm font-medium text-white"
              >
                Generate
              </a>
              <a
                href="/queue"
                className="rounded bg-gray-100 px-3 py-1.5 text-sm dark:bg-gray-800"
              >
                Open in Queue
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
