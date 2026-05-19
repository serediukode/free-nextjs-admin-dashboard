"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

const SKUS = [
  "vika-deep-blue",
  "vika-ice-cool",
  "vika-strawberry-mojito",
  "vika-frozen-mint",
  "vika-cherry-berry",
  "vika-strawberry-ice",
  "sober-slim-red",
  "pablo-ice-cold",
  "pablo-excl-frosted-ice",
  "pablo-excl-dark-cherry",
];

const FORMATS = ["ig_post", "ig_stories", "ig_reel", "tiktok", "carousel", "reels_seed"];
const MODES = ["local", "auto", "platform", "telegram"];

function GenerateForm() {
  const params = useSearchParams();
  const initSku = params.get("sku") || SKUS[0];
  const initFmt = params.get("format") || FORMATS[0];
  const [sku, setSku] = useState(SKUS.includes(initSku) ? initSku : SKUS[0]);
  const [format, setFormat] = useState(FORMATS.includes(initFmt) ? initFmt : FORMATS[0]);
  const [mode, setMode] = useState("local");
  const [running, setRunning] = useState(false);
  useEffect(() => {
    const s = params.get("sku");
    const f = params.get("format");
    if (s && SKUS.includes(s)) setSku(s);
    if (f && FORMATS.includes(f)) setFormat(f);
  }, [params]);
  const [lines, setLines] = useState<string[]>([]);
  const [finishedCode, setFinishedCode] = useState<number | null>(null);
  const [latest, setLatest] = useState<{ url: string; filename: string; size_kb: number } | null>(null);

  // After pipeline finishes successfully, fetch newest library item for this SKU+format
  useEffect(() => {
    if (finishedCode !== 0) return;
    let cancelled = false;
    (async () => {
      // Give filesystem a moment to flush
      await new Promise((r) => setTimeout(r, 500));
      const params = new URLSearchParams({ sku, format, limit: "1" });
      try {
        const res = await fetch(`/api/library?${params}`, { cache: "no-store" });
        const json = await res.json();
        if (cancelled) return;
        const top = json.items?.[0];
        if (top) setLatest({ url: top.url, filename: top.filename, size_kb: top.size_kb });
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [finishedCode, sku, format]);

  async function run() {
    setRunning(true);
    setLines([]);
    setFinishedCode(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sku, format, approval_mode: mode }),
      });
      if (!res.body) throw new Error("no body");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop() || "";
        for (const ev of events) {
          const dataLine = ev.split("\n").find((l) => l.startsWith("data:"));
          const evLine = ev.split("\n").find((l) => l.startsWith("event:"));
          if (!dataLine) continue;
          const payload = JSON.parse(dataLine.slice(5).trim());
          const kind = evLine ? evLine.slice(6).trim() : "data";
          if (kind === "finished") setFinishedCode(payload.code);
          else if (kind === "started")
            setLines((prev) => [...prev, `[started] pid=${payload.pid}`]);
          else if (payload.line) setLines((prev) => [...prev, payload.line]);
        }
      }
    } catch (e) {
      setLines((prev) => [...prev, `[error] ${String(e)}`]);
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
          Trigger generation
        </h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <label className="text-sm">
            <div className="mb-1 text-xs uppercase tracking-wide text-gray-500">SKU</div>
            <select
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              className="w-full rounded border border-gray-200 bg-white px-2 py-1.5 dark:border-gray-700 dark:bg-gray-800"
            >
              {SKUS.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <div className="mb-1 text-xs uppercase tracking-wide text-gray-500">Format</div>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              className="w-full rounded border border-gray-200 bg-white px-2 py-1.5 dark:border-gray-700 dark:bg-gray-800"
            >
              {FORMATS.map((f) => (
                <option key={f}>{f}</option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <div className="mb-1 text-xs uppercase tracking-wide text-gray-500">Approval mode</div>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              className="w-full rounded border border-gray-200 bg-white px-2 py-1.5 dark:border-gray-700 dark:bg-gray-800"
            >
              {MODES.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </label>
          <div className="flex items-end">
            <button
              disabled={running}
              onClick={run}
              className="w-full rounded bg-emerald-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {running ? "Running…" : "Run pipeline"}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-black p-4 font-mono text-xs text-emerald-200 shadow-sm lg:col-span-2">
          {lines.length === 0 ? (
            <span className="text-gray-500">Output will appear here.</span>
          ) : (
            lines.map((l, i) => (
              <div key={i} className="whitespace-pre-wrap">
                {l}
              </div>
            ))
          )}
          {finishedCode !== null && (
            <div
              className={`mt-2 font-bold ${
                finishedCode === 0 ? "text-emerald-300" : "text-rose-400"
              }`}
            >
              [finished] exit code {finishedCode}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Result preview</h3>
          {latest ? (
            <div className="space-y-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={latest.url} alt={latest.filename} className="w-full rounded-lg border border-gray-200 dark:border-gray-700" />
              <div className="truncate text-xs text-gray-500">{latest.filename}</div>
              <div className="flex items-center justify-between text-[10px] text-gray-400">
                <span>{latest.size_kb} KB</span>
                <a href="/library" className="text-emerald-600 hover:underline">Open Library →</a>
              </div>
            </div>
          ) : (
            <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-gray-300 text-xs text-gray-500 dark:border-gray-700">
              {running ? "Generating…" : "No result yet"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function GeneratePage() {
  return (
    <Suspense fallback={null}>
      <GenerateForm />
    </Suspense>
  );
}
