"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

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
const GEN_SIGNAL_KEY = "nicom-last-generation-ts"; // cross-tab signal

function GenerateForm() {
  const params = useSearchParams();
  const urlSku = params.get("sku");
  const urlFmt = params.get("format");

  // URL params take priority; fall back to sessionStorage, then defaults
  const [sku, setSku] = useState<string>(() => {
    if (urlSku && SKUS.includes(urlSku)) return urlSku;
    try {
      const s = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "{}").sku;
      if (s && SKUS.includes(s)) return s;
    } catch {}
    return SKUS[0];
  });

  const [format, setFormat] = useState<string>(() => {
    if (urlFmt && FORMATS.includes(urlFmt)) return urlFmt;
    try {
      const f = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "{}").format;
      if (f && FORMATS.includes(f)) return f;
    } catch {}
    return FORMATS[0];
  });

  const [mode, setMode] = useState("local");
  const [running, setRunning] = useState(false);
  const [lines, setLines] = useState<string[]>(() => {
    try {
      const l = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "{}").lines;
      return Array.isArray(l) ? l : [];
    } catch { return []; }
  });
  const [finishedCode, setFinishedCode] = useState<number | null>(() => {
    try {
      const fc = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "{}").finishedCode;
      return typeof fc === "number" ? fc : null;
    } catch { return null; }
  });
  const [latest, setLatest] = useState<{ url: string; filename: string; size_kb: number; sku: string; format: string } | null>(() => {
    try {
      return JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "{}").latest || null;
    } catch { return null; }
  });

  const logRef = useRef<HTMLDivElement>(null);

  // Sync URL params → state when they change (e.g. navigation from Content Plan)
  useEffect(() => {
    if (urlSku && SKUS.includes(urlSku)) setSku(urlSku);
    if (urlFmt && FORMATS.includes(urlFmt)) setFormat(urlFmt);
  }, [urlSku, urlFmt]);

  // Persist to sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ lines, finishedCode, latest, sku, format }));
    } catch {}
  }, [lines, finishedCode, latest, sku, format]);

  // Auto-scroll log to bottom
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [lines]);

  // After successful generation: find the new file, signal other sections
  useEffect(() => {
    if (finishedCode !== 0) return;
    let cancelled = false;

    async function findResult(attempt = 0) {
      if (cancelled) return;
      await new Promise(r => setTimeout(r, attempt === 0 ? 800 : 2000));
      if (cancelled) return;
      try {
        const p = new URLSearchParams({ sku, format, limit: "1" });
        const res = await fetch(`/api/library?${p}`, { cache: "no-store" });
        const json = await res.json();
        if (cancelled) return;
        const top = json.items?.[0];
        if (top) {
          setLatest({ url: top.url, filename: top.filename, size_kb: top.size_kb, sku, format });
          // Signal Library and Logs to refresh
          localStorage.setItem(GEN_SIGNAL_KEY, Date.now().toString());
        } else if (attempt < 5) {
          // Retry up to 5 times (10s total) — pipeline may still be writing
          findResult(attempt + 1);
        }
      } catch {}
    }

    findResult();
    return () => { cancelled = true; };
  }, [finishedCode, sku, format]);

  async function run() {
    setRunning(true);
    setLines([]);
    setFinishedCode(null);
    setLatest(null);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sku, format, approval_mode: mode }),
      });
      if (!res.body) throw new Error("no streaming body");
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
          const dataLine = ev.split("\n").find(l => l.startsWith("data:"));
          const evLine   = ev.split("\n").find(l => l.startsWith("event:"));
          if (!dataLine) continue;
          const payload = JSON.parse(dataLine.slice(5).trim());
          const kind = evLine ? evLine.slice(6).trim() : "data";
          if (kind === "finished") setFinishedCode(payload.code);
          else if (kind === "started") setLines(prev => [...prev, `▶ pid=${payload.pid} · sku=${sku} · format=${format} · mode=${mode}`]);
          else if (payload.line)      setLines(prev => [...prev, payload.line]);
        }
      }
    } catch (e) {
      setLines(prev => [...prev, `[error] ${String(e)}`]);
      setFinishedCode(1);
    } finally {
      setRunning(false);
    }
  }

  function clear() {
    setLines([]);
    setFinishedCode(null);
    setLatest(null);
    try { sessionStorage.removeItem(STORAGE_KEY); } catch {}
  }

  return (
    <div className="onyx-page space-y-6" style={{ maxWidth: "1200px" }}>
      {/* Page header */}
      <div>
        <p className="onyx-eyebrow mb-2">Pipeline · manual trigger</p>
        <h1 style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: "32px", letterSpacing: "-0.3px", color: "var(--color-nicom-text)", marginBottom: "8px" }}>Generate</h1>
        <p style={{ color: "var(--color-nicom-muted)", fontSize: "13px" }}>LangGraph 8-node pipeline · SSE streaming output · result auto-appears in Library</p>
      </div>

      {/* Controls */}
      <div className="onyx-panel">
        <p className="onyx-eyebrow mb-4">Trigger generation</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", alignItems: "end" }}>
          <label style={{ flex: "2 1 200px" }}>
            <div className="onyx-h3 mb-2">SKU</div>
            <select value={sku} onChange={e => setSku(e.target.value)} className="onyx-select">
              {SKUS.map(s => <option key={s}>{s}</option>)}
            </select>
          </label>
          <label style={{ flex: "1 1 130px" }}>
            <div className="onyx-h3 mb-2">Format</div>
            <select value={format} onChange={e => setFormat(e.target.value)} className="onyx-select">
              {FORMATS.map(f => <option key={f}>{f}</option>)}
            </select>
          </label>
          <label style={{ flex: "1 1 130px" }}>
            <div className="onyx-h3 mb-2">Approval mode</div>
            <select value={mode} onChange={e => setMode(e.target.value)} className="onyx-select">
              {MODES.map(m => <option key={m}>{m}</option>)}
            </select>
          </label>
          <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
            <button disabled={running} onClick={run} className="btn-onyx-primary"
              style={{ padding: "10px 20px", fontSize: "11px", whiteSpace: "nowrap" }}>
              {running ? "Running…" : "▶ Run"}
            </button>
            <button onClick={clear} className="btn-onyx-ghost"
              style={{ padding: "10px 14px", fontSize: "11px" }}>
              ✕
            </button>
          </div>
        </div>
      </div>

      {/* Output + Preview */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr min(320px, 35%)", gap: "16px" }}>
        {/* Streaming log */}
        <div ref={logRef} className="nicom-mono"
          style={{ borderRadius: "14px", background: "var(--color-nicom-bg)", border: "0.5px solid var(--color-nicom-border)", padding: "16px", color: "var(--color-ok)", minHeight: "320px", maxHeight: "500px", overflowY: "auto", fontSize: "11px", lineHeight: "1.6" }}>
          {lines.length === 0 ? (
            <span style={{ color: "var(--color-nicom-faint)" }}>Pipeline output will stream here…</span>
          ) : (
            lines.map((l, i) => (
              <div key={i} className="whitespace-pre-wrap" style={{
                color: l.startsWith("[error]") || l.startsWith("Error") ? "var(--color-danger)"
                     : l.startsWith("▶") ? "var(--color-pablo)"
                     : l.startsWith("[WARNING]") || l.includes("WARNING") ? "var(--color-warn)"
                     : "var(--color-ok)",
              }}>{l}</div>
            ))
          )}
          {finishedCode !== null && (
            <div style={{ marginTop: "12px", fontWeight: 700, padding: "8px 12px", borderRadius: "6px",
              background: finishedCode === 0 ? "rgba(93,202,165,0.08)" : "rgba(217,112,112,0.08)",
              color: finishedCode === 0 ? "var(--color-ok)" : "var(--color-danger)",
              border: `0.5px solid ${finishedCode === 0 ? "rgba(93,202,165,0.3)" : "rgba(217,112,112,0.3)"}` }}>
              {finishedCode === 0 ? "✓ Pipeline finished — exit 0" : `✕ Pipeline failed — exit ${finishedCode}`}
            </div>
          )}
        </div>

        {/* Result preview */}
        <div className="onyx-panel" style={{ display: "flex", flexDirection: "column" }}>
          <p className="onyx-eyebrow mb-3">Result preview</p>
          {latest ? (
            <div style={{ flex: 1 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={latest.url} alt={latest.filename}
                style={{ width: "100%", borderRadius: "8px", border: "0.5px solid var(--color-nicom-border)", display: "block" }} />
              <div style={{ marginTop: "10px" }}>
                <div style={{ fontSize: "11px", color: "var(--color-nicom-faint)", marginBottom: "4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{latest.filename}</div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "var(--color-nicom-faint)", marginBottom: "12px" }}>
                  <span>{latest.size_kb} KB</span>
                  <span className="onyx-pill onyx-pill-ok" style={{ fontSize: "8px" }}>Generated</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <Link href="/library" className="btn-onyx-primary" style={{ textDecoration: "none", justifyContent: "center", fontSize: "10px" }}>
                    ◇ Open in Library
                  </Link>
                  <Link href="/logs" className="btn-onyx-ghost" style={{ textDecoration: "none", justifyContent: "center", fontSize: "10px" }}>
                    View in Logs
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", borderRadius: "8px", border: "0.5px dashed var(--color-nicom-border)", padding: "24px", textAlign: "center" }}>
              <div style={{ fontSize: "11px", color: "var(--color-nicom-faint)", lineHeight: 1.6 }}>
                {running ? (
                  <><span style={{ color: "var(--color-pablo)" }}>◇</span> Generating…</>
                ) : finishedCode === 0 ? (
                  <><span style={{ color: "var(--color-warn)" }}>◇</span> Searching for result…</>
                ) : (
                  <>Run pipeline to see result here</>
                )}
              </div>
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
