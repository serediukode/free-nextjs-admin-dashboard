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
  "In Brief":      "bg-[var(--color-warn)]/15 text-[var(--color-warn)]",
  Approved:        "bg-[var(--color-ok)]/15 text-[var(--color-ok)]",
  "In Production": "bg-[var(--color-vika-slim)]/15 text-[var(--color-vika-slim)]",
  Published:       "bg-[var(--color-accent)]/15 text-[var(--color-accent)]",
  Rejected:        "bg-[var(--color-danger)]/15 text-[var(--color-danger)]",
  "Legacy v1":     "bg-[var(--color-nicom-elev)] text-[var(--color-nicom-faint)]",
};

const BRAND_BORDER: Record<string, string> = {
  "VIKA Main": "border-l-2 border-[var(--color-vika-slim)]",
  "VIKA Slim":  "border-l-2 border-[var(--color-vika-slim)]/60",
  SBR:          "border-l-2 border-[var(--color-sbr)]",
  Pablo:        "border-l-2 border-[var(--color-pablo)]",
};

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function daysInMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}

export default function ContentPlanCalendar({ externalItems }: { externalItems?: Item[] }) {
  const [items, setItems] = useState<Item[]>(externalItems || []);
  const [err, setErr] = useState<string | null>(null);
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()));
  const [selected, setSelected] = useState<Item | null>(null);

  useEffect(() => {
    if (externalItems !== undefined) {
      setItems(externalItems);
      return;
    }
    fetch("/api/content-plan", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => setItems(j.items || []))
      .catch((e) => setErr(String(e)));
  }, [externalItems]);

  const byDate = new Map<string, Item[]>();
  for (const it of items) {
    if (!it.date) continue;
    const key = it.date.slice(0, 10);
    if (!byDate.has(key)) byDate.set(key, []);
    byDate.get(key)!.push(it);
  }

  const total = daysInMonth(cursor);
  const firstDay = cursor.getDay();
  const offset = (firstDay + 6) % 7;
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
      {err && (
        <div className="nicom-elev border-l-4 border-[var(--color-danger)] p-3 text-sm text-[var(--color-danger)]">
          {err}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
            className="rounded border border-[var(--color-nicom-border)] bg-[var(--color-nicom-elev)] px-3 py-1 text-sm text-[var(--color-nicom-muted)] hover:text-[var(--color-nicom-text)]"
          >
            ←
          </button>
          <div className="min-w-[180px] text-center text-lg font-semibold capitalize text-[var(--color-nicom-text)]">
            {monthLabel}
          </div>
          <button
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
            className="rounded border border-[var(--color-nicom-border)] bg-[var(--color-nicom-elev)] px-3 py-1 text-sm text-[var(--color-nicom-muted)] hover:text-[var(--color-nicom-text)]"
          >
            →
          </button>
          <button
            onClick={() => setCursor(startOfMonth(new Date()))}
            className="nicom-chip nicom-chip-ok hover:opacity-80"
          >
            Today
          </button>
        </div>
        <div className="nicom-mono text-xs text-[var(--color-nicom-faint)]">
          {items.length} entries · {undated} undated
        </div>
      </div>

      <div className="nicom-surface overflow-hidden">
        <div className="grid grid-cols-7 border-b border-[var(--color-nicom-hairline)] text-[10px] uppercase tracking-wider text-[var(--color-nicom-faint)]">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
            <div key={d} className="border-r border-[var(--color-nicom-hairline)] px-2 py-2 last:border-r-0 font-medium">
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
                className={`min-h-[110px] border-b border-r border-[var(--color-nicom-hairline)] p-1 last-col:border-r-0 ${
                  cell.date ? "" : "bg-[var(--color-nicom-bg)]"
                } ${today ? "bg-[var(--color-ok)]/5" : ""}`}
              >
                {cell.date && (
                  <div className="mb-1 text-xs text-[var(--color-nicom-faint)]">{cell.date.getDate()}</div>
                )}
                <div className="space-y-1">
                  {events.slice(0, 4).map((it) => (
                    <button
                      key={it.id}
                      onClick={() => setSelected(it)}
                      className={`block w-full truncate rounded px-1.5 py-0.5 text-left text-[11px] hover:opacity-80 ${
                        STATUS_COLOR[it.status] || "bg-[var(--color-nicom-elev)] text-[var(--color-nicom-muted)]"
                      } ${BRAND_BORDER[it.brand] || ""}`}
                      title={`${it.brand} · ${it.channel} · ${it.status}`}
                    >
                      {it.title || it.sku || "(untitled)"}
                    </button>
                  ))}
                  {events.length > 4 && (
                    <div className="px-1 text-[10px] text-[var(--color-nicom-faint)]">+{events.length - 4} more</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="nicom-surface max-h-[90vh] w-full max-w-xl overflow-auto p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <h2 className="text-lg font-semibold text-[var(--color-nicom-text)]">
                {selected.title || "(untitled)"}
              </h2>
              <button
                onClick={() => setSelected(null)}
                className="nicom-elev px-2 py-1 text-sm text-[var(--color-nicom-muted)] hover:text-[var(--color-nicom-text)]"
              >
                ×
              </button>
            </div>
            <dl className="space-y-2 text-sm">
              {[
                { label: "SKU", value: <span className="nicom-mono">{selected.sku}</span> },
                { label: "Channel", value: selected.channel },
                { label: "Brand", value: selected.brand },
                {
                  label: "Status",
                  value: (
                    <span className={`rounded px-2 py-0.5 text-xs ${STATUS_COLOR[selected.status] || "bg-[var(--color-nicom-elev)] text-[var(--color-nicom-faint)]"}`}>
                      {selected.status || "—"}
                    </span>
                  ),
                },
                { label: "Date", value: selected.date },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between border-b border-[var(--color-nicom-hairline)] pb-2">
                  <dt className="text-[var(--color-nicom-faint)]">{label}</dt>
                  <dd className="text-[var(--color-nicom-text)]">{value}</dd>
                </div>
              ))}
              {selected.headline && (
                <div>
                  <dt className="text-[var(--color-nicom-faint)]">Headline UA</dt>
                  <dd className="mt-1 nicom-elev p-2 text-sm text-[var(--color-nicom-muted)]">
                    {selected.headline}
                  </dd>
                </div>
              )}
              {selected.brief && (
                <div>
                  <dt className="text-[var(--color-nicom-faint)]">Brief</dt>
                  <dd className="mt-1 max-h-40 overflow-auto nicom-elev p-2 text-sm text-[var(--color-nicom-muted)]">
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
                className="rounded bg-[var(--color-accent)] px-3 py-1.5 text-sm font-medium text-white hover:opacity-90"
              >
                Generate
              </a>
              <a
                href="/queue"
                className="nicom-elev px-3 py-1.5 text-sm text-[var(--color-nicom-muted)] hover:text-[var(--color-nicom-text)]"
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
