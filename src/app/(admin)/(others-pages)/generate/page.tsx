"use client";

import { useState } from "react";

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

export default function GeneratePage() {
  const [sku, setSku] = useState(SKUS[0]);
  const [format, setFormat] = useState(FORMATS[0]);
  const [mode, setMode] = useState("local");
  const [running, setRunning] = useState(false);
  const [lines, setLines] = useState<string[]>([]);
  const [finishedCode, setFinishedCode] = useState<number | null>(null);

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
    } catch (e: any) {
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

      <div className="rounded-2xl border border-gray-200 bg-black p-4 font-mono text-xs text-emerald-200 shadow-sm">
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
    </div>
  );
}
