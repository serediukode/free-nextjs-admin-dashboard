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

const STORAGE_KEY = "nicom-generate-session";

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

  // Restore from sessionStorage on mount
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        const { lines: l, finishedCode: fc, latest: lt, sku: s, format: f } = JSON.parse(saved);
        if (l?.length) setLines(l);
        if (fc !== undefined) setFinishedCode(fc);
        if (lt) setLatest(lt);
        if (s && SKUS.includes(s)) setSku(s);
        if (f && FORMATS.includes(f)) setFormat(f);
      }
    } catch {}
  }, []);

  // Persist to sessionStorage whenever state changes
  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ lines, finishedCode, latest, sku, format }));
    } catch {}
  }, [lines, finishedCode, latest, sku, format]);

  // After pipeline finishes successfully, fetch newest library item for this SKU+format
  useEffect(() => {
    if (finishedCode !== 0) return;
    let cancelled = false;
    (async () => {
      // Give filesystem a moment to flush
      await new Promise((r) => setTimeout(r, 500));
      const p = new URLSearchParams({ sku, format, limit: "1" });
      try {
        const res = await fetch(`/api/library?${p}`, { cache: "no-store" });
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
      <div className="onyx-panel">
        <p className="onyx-eyebrow mb-4">Trigger generation</p>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <label>
            <div className="onyx-h3 mb-2">SKU</div>
            <select
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              className="onyx-select"
            >
              {SKUS.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <label>
            <div className="onyx-h3 mb-2">Format</div>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              className="onyx-select"
            >
              {FORMATS.map((f) => (
                <option key={f}>{f}</option>
              ))}
            </select>
          </label>
          <label>
            <div className="onyx-h3 mb-2">Approval mode</div>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              className="onyx-select"
            >
              {MODES.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </label>
          <div className="flex items-end gap-2">
            <button
              disabled={running}
              onClick={run}
              className="btn-onyx-primary"
              style={{ flex: 1, justifyContent: "center", padding: "10px 16px", fontSize: "11px" }}
            >
              {running ? "Running…" : "Run pipeline"}
            </button>
            <button
              onClick={() => { setLines([]); setFinishedCode(null); setLatest(null); sessionStorage.removeItem(STORAGE_KEY); }}
              className="btn-onyx-ghost"
              style={{ padding: "10px 16px", fontSize: "11px" }}
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div
          className="nicom-mono lg:col-span-2"
          style={{
            borderRadius: "14px",
            background: "var(--color-nicom-bg)",
            border: "0.5px solid var(--color-nicom-border)",
            padding: "16px",
            color: "var(--color-ok)",
            minHeight: "200px",
          }}
        >
          {lines.length === 0 ? (
            <span style={{ color: "var(--color-nicom-faint)" }}>Output will appear here.</span>
          ) : (
            lines.map((l, i) => (
              <div key={i} className="whitespace-pre-wrap">
                {l}
              </div>
            ))
          )}
          {finishedCode !== null && (
            <div
              style={{
                marginTop: "8px",
                fontWeight: 700,
                color: finishedCode === 0 ? "var(--color-ok)" : "var(--color-danger)",
              }}
            >
              [finished] exit code {finishedCode}
            </div>
          )}
        </div>

        <div className="onyx-panel">
          <p className="onyx-eyebrow mb-3">Result preview</p>
          {latest ? (
            <div className="space-y-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={latest.url}
                alt={latest.filename}
                style={{ width: "100%", borderRadius: "8px", border: "0.5px solid var(--color-nicom-border)" }}
              />
              <div style={{ fontSize: "11px", color: "var(--color-nicom-faint)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{latest.filename}</div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "10px", color: "var(--color-nicom-faint)" }}>
                <span>{latest.size_kb} KB</span>
                <a href="/library" style={{ color: "var(--color-pablo)" }}>Open Library →</a>
              </div>
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                height: "192px",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "8px",
                border: "0.5px dashed var(--color-nicom-border)",
                fontSize: "11px",
                color: "var(--color-nicom-faint)",
              }}
            >
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
