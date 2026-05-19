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
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {items.length} of {total} generations (auto-refresh 15s). Source: <code>test-output/</code> + <code>output/</code>.
        </p>
        <div className="flex items-center gap-2">
          <input
            placeholder="filter sku (e.g. vika-deep-blue)"
            value={sku}
            onChange={(e) => setSku(e.target.value)}
            className="rounded border border-gray-300 bg-white px-3 py-1 text-xs dark:border-gray-700 dark:bg-gray-900"
          />
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value)}
            className="rounded border border-gray-300 bg-white px-3 py-1 text-xs dark:border-gray-700 dark:bg-gray-900"
          >
            {FORMATS.map((f) => (
              <option key={f} value={f}>
                {f || "all formats"}
              </option>
            ))}
          </select>
          <button
            onClick={load}
            className="rounded bg-gray-900 px-3 py-1 text-xs text-white dark:bg-gray-100 dark:text-gray-900"
          >
            Refresh
          </button>
        </div>
      </div>

      {err && <div className="rounded bg-rose-100 p-3 text-sm text-rose-700">{err}</div>}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {items.map((it) => (
          <button
            key={`${it.source}/${it.filename}`}
            onClick={() => setSelected(it)}
            className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white text-left transition hover:border-gray-400 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-gray-600"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={it.url}
              alt={it.filename}
              className="aspect-square w-full object-cover"
              loading="lazy"
            />
            <div className="p-3">
              <div className="truncate text-xs font-semibold text-gray-900 dark:text-white">
                {it.sku || it.filename}
              </div>
              <div className="mt-1 flex items-center justify-between text-[10px] text-gray-500">
                <span>{it.format || "—"}</span>
                <span>{it.size_kb} KB</span>
              </div>
              <div className="mt-1 text-[10px] text-gray-400">
                {new Date(it.modified_at).toLocaleString()}
              </div>
            </div>
          </button>
        ))}
        {!items.length && !err && (
          <div className="col-span-full rounded-xl border border-dashed border-gray-300 p-12 text-center text-sm text-gray-500 dark:border-gray-700">
            No generations yet. Run <code>scripts/run_pipeline.py</code> or use Generate page.
          </div>
        )}
      </div>

      {/* Lightbox modal */}
      {selected && (
        <div
          onClick={() => setSelected(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="grid max-h-[90vh] w-full max-w-6xl grid-cols-1 gap-4 overflow-y-auto rounded-2xl bg-gray-950 p-6 md:grid-cols-2"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={selected.url} alt={selected.filename} className="w-full rounded-lg" />
            <div className="space-y-3 text-sm text-gray-300">
              <h3 className="text-base font-semibold text-white">{selected.filename}</h3>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded bg-gray-900 p-2">
                  <div className="text-gray-500">SKU</div>
                  <div className="font-semibold text-white">{selected.sku || "—"}</div>
                </div>
                <div className="rounded bg-gray-900 p-2">
                  <div className="text-gray-500">Format</div>
                  <div className="font-semibold text-white">{selected.format || "—"}</div>
                </div>
                <div className="rounded bg-gray-900 p-2">
                  <div className="text-gray-500">Size</div>
                  <div className="font-semibold text-white">{selected.size_kb} KB</div>
                </div>
                <div className="rounded bg-gray-900 p-2">
                  <div className="text-gray-500">Source</div>
                  <div className="font-semibold text-white">{selected.source}</div>
                </div>
              </div>
              <div className="text-xs text-gray-500">Created: {new Date(selected.modified_at).toLocaleString()}</div>
              {selected.prompt_log && (
                <div className="text-xs">
                  <div className="mb-1 text-gray-500">Prompt log:</div>
                  <code className="block break-all rounded bg-gray-900 p-2 text-[10px] text-gray-400">
                    {selected.prompt_log}
                  </code>
                </div>
              )}
              <div className="flex gap-2 pt-2">
                <a
                  href={selected.url}
                  download={selected.filename}
                  className="rounded bg-white px-4 py-2 text-xs font-semibold text-gray-900"
                >
                  Download
                </a>
                <button
                  onClick={() => setSelected(null)}
                  className="rounded border border-gray-700 px-4 py-2 text-xs text-gray-300"
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
