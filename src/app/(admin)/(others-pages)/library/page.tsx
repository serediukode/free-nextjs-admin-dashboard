"use client";
import { useEffect, useState, useCallback } from "react";

type LibraryItem = {
  filename: string; sku: string | null; format: string | null;
  source: "test-output" | "output" | "tmp"; size_kb: number;
  modified_at: string; modified_ts: number; prompt_log: string | null; url: string;
};
type ViewMode = "grid" | "list" | "kanban" | "timeline";
const FORMATS = ["", "ig_post", "ig_stories", "ig_reel", "tiktok", "carousel", "reels_seed"];

export default function LibraryPage() {
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [err, setErr] = useState<string | null>(null);
  const [sku, setSku] = useState("");
  const [format, setFormat] = useState("");
  const [selected, setSelected] = useState<LibraryItem | null>(null);
  const [view, setView] = useState<ViewMode>("grid");

  const load = useCallback(async () => {
    try {
      const p = new URLSearchParams();
      if (sku) p.set("sku", sku);
      if (format) p.set("format", format);
      p.set("limit", "60");
      const res = await fetch(`/api/library?${p}`, { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      setItems(json.items || []);
      setTotal(json.total || 0);
      setErr(null);
    } catch (e) { setErr(String(e)); }
  }, [sku, format]);

  useEffect(() => {
    load();
    const id = setInterval(load, 10000);
    // Refresh immediately when Generate page signals new result
    function onStorage(e: StorageEvent) {
      if (e.key === "nicom-last-generation-ts") load();
    }
    window.addEventListener("storage", onStorage);
    return () => { clearInterval(id); window.removeEventListener("storage", onStorage); };
  }, [load]);

  // ── Grid View ──
  function GridView() {
    return (
      <div className="onyx-stagger" style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: "12px" }}
        data-grid-cols="2 sm:3 lg:4 xl:5">
        {items.map(it => (
          <button key={`${it.source}/${it.filename}`} onClick={() => setSelected(it)}
            className="onyx-card-lift" style={{ overflow: "hidden", borderRadius: "14px", border: "0.5px solid var(--color-nicom-border)", background: "var(--color-nicom-surface)", textAlign: "left", cursor: "pointer" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={it.url} alt={it.filename} style={{ aspectRatio: "4/5", width: "100%", objectFit: "cover" }} loading="lazy" />
            <div style={{ padding: "12px" }}>
              <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-nicom-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{it.sku || it.filename}</div>
              <div style={{ marginTop: "4px", display: "flex", justifyContent: "space-between", fontSize: "10px", color: "var(--color-nicom-faint)" }}>
                <span>{it.format || "—"}</span><span>{it.size_kb} KB</span>
              </div>
            </div>
          </button>
        ))}
        {!items.length && !err && <EmptyState />}
      </div>
    );
  }

  // ── List View (nicom-studio lib-list pattern) ──
  function ListView() {
    return (
      <div className="onyx-stagger">
        {items.map((it, idx) => (
          <div key={`${it.source}/${it.filename}`} className="onyx-row"
            onClick={() => setSelected(it)}
            style={{ display: "grid", gridTemplateColumns: "32px 1fr auto", gap: "18px", alignItems: "center", padding: "18px 8px", borderBottom: "0.5px solid var(--color-nicom-border)", overflow: "hidden" }}>
            <span className="nicom-mono" style={{ fontSize: "11px", color: "var(--color-nicom-dim)", letterSpacing: "1px" }}>{String(idx + 1).padStart(2, "0")}</span>
            <div>
              <div style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: "22px", color: "var(--color-nicom-muted)", letterSpacing: "-0.3px", lineHeight: 1.15, transition: "color 0.25s" }}
                onMouseEnter={e => (e.currentTarget.style.color = "var(--color-nicom-text)")}
                onMouseLeave={e => (e.currentTarget.style.color = "var(--color-nicom-muted)")}>
                {it.sku || it.filename}
              </div>
              <div className="nicom-mono" style={{ fontSize: "10px", color: "var(--color-nicom-dim)", letterSpacing: "1.2px", textTransform: "uppercase", marginTop: "5px" }}>
                {it.format || "—"} · {it.source}
              </div>
            </div>
            <div style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--color-nicom-dim)", letterSpacing: "1.2px", textTransform: "uppercase", lineHeight: 1.7 }}>
              <div style={{ color: "var(--color-nicom-muted)" }}>{it.size_kb} KB</div>
              <div>{new Date(it.modified_at).toLocaleDateString()}</div>
            </div>
          </div>
        ))}
        {!items.length && !err && <EmptyState />}
      </div>
    );
  }

  // ── Kanban View (columns by format) ──
  function KanbanView() {
    const formats = ["ig_post", "ig_stories", "ig_reel", "tiktok", "carousel", "reels_seed"];
    return (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "14px" }}>
        {formats.map(fmt => {
          const cards = items.filter(it => it.format === fmt);
          if (!cards.length && !format) return null;
          return (
            <div key={fmt}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "8px", marginBottom: "12px", borderBottom: "0.5px solid var(--color-nicom-border-strong)", fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--color-nicom-faint)", letterSpacing: "1.5px", textTransform: "uppercase" }}>
                <span>{fmt.replace("_", " ")}</span>
                <span style={{ color: "var(--color-pablo)", fontWeight: 600 }}>{cards.length}</span>
              </div>
              <div className="onyx-stagger">
                {cards.slice(0, 8).map(it => (
                  <div key={`${it.source}/${it.filename}`} className="onyx-card-nudge" onClick={() => setSelected(it)}
                    style={{ background: "rgba(255,255,255,0.02)", border: "0.5px solid var(--color-nicom-border)", borderRadius: "5px", marginBottom: "8px", cursor: "pointer", overflow: "hidden" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={it.url} alt={it.filename} style={{ width: "100%", aspectRatio: "16/9", objectFit: "cover" }} loading="lazy" />
                    <div style={{ padding: "8px 10px" }}>
                      <div style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: "13px", color: "var(--color-nicom-text)", letterSpacing: "-0.2px" }}>{it.sku || it.filename}</div>
                      <div className="nicom-mono" style={{ fontSize: "9px", color: "var(--color-nicom-faint)", letterSpacing: "1px", textTransform: "uppercase", marginTop: "3px" }}>{it.size_kb} KB · {new Date(it.modified_at).toLocaleDateString()}</div>
                    </div>
                  </div>
                ))}
                {!cards.length && (
                  <div style={{ border: "1px dashed var(--color-nicom-border)", borderRadius: "5px", padding: "20px", textAlign: "center", fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--color-nicom-dim)", textTransform: "uppercase" }}>Empty</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // ── Timeline View (grouped by date) ──
  function TimelineView() {
    const sorted = [...items].sort((a, b) => b.modified_ts - a.modified_ts);
    const groups: Record<string, LibraryItem[]> = {};
    for (const it of sorted) {
      const day = new Date(it.modified_at).toLocaleDateString("uk-UA", { weekday: "short", day: "numeric", month: "short" }).toUpperCase();
      if (!groups[day]) groups[day] = [];
      groups[day].push(it);
    }
    return (
      <div style={{ position: "relative", paddingLeft: "32px" }}>
        <div style={{ position: "absolute", left: "10px", top: "20px", bottom: "20px", width: "1px", background: "rgba(255,255,255,0.08)" }} />
        <div className="onyx-stagger">
          {Object.entries(groups).map(([day, dayItems]) => (
            <div key={day} style={{ marginBottom: "28px", position: "relative" }}>
              <div style={{ position: "absolute", left: "-27px", top: "4px", width: "11px", height: "11px", borderRadius: "50%", background: "var(--color-nicom-bg)", border: "1.5px solid var(--color-pablo)" }} />
              <div className="onyx-eyebrow" style={{ marginBottom: "10px", color: "var(--color-pablo)" }}>{day}</div>
              {dayItems.map(it => (
                <div key={`${it.source}/${it.filename}`} className="onyx-row" onClick={() => setSelected(it)}
                  style={{ display: "grid", gridTemplateColumns: "56px 1fr auto", gap: "14px", alignItems: "center", padding: "10px 14px", marginBottom: "5px", background: "rgba(255,255,255,0.02)", borderRadius: "6px" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={it.url} alt="" style={{ width: "56px", aspectRatio: "1", objectFit: "cover", borderRadius: "4px" }} loading="lazy" />
                  <div>
                    <div style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: "15px", color: "var(--color-nicom-text)", letterSpacing: "-0.2px" }}>{it.sku || it.filename}</div>
                    <div className="nicom-mono" style={{ fontSize: "9px", color: "var(--color-nicom-faint)", letterSpacing: "1px", textTransform: "uppercase", marginTop: "2px" }}>{it.format || "—"} · {it.source}</div>
                  </div>
                  <div style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--color-nicom-muted)" }}>{it.size_kb} KB</div>
                </div>
              ))}
            </div>
          ))}
          {!items.length && !err && <EmptyState />}
        </div>
      </div>
    );
  }

  function EmptyState() {
    return (
      <div style={{ gridColumn: "1 / -1", borderRadius: "14px", border: "0.5px dashed var(--color-nicom-border)", padding: "48px", textAlign: "center", fontSize: "13px", color: "var(--color-nicom-faint)" }}>
        No generations yet. Use the Generate page to create content.
      </div>
    );
  }

  return (
    <div className="onyx-page space-y-6">
      {/* Page header */}
      <div>
        <p className="onyx-eyebrow mb-2">Library · {items.length} of {total}</p>
        <h1 style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: "32px", letterSpacing: "-0.3px", color: "var(--color-nicom-text)", marginBottom: "8px" }}>Creative Library</h1>
        <p style={{ color: "var(--color-nicom-muted)", fontSize: "13px" }}>All generated assets · auto-refresh 15s · Grid / List / Kanban / Timeline</p>
      </div>

      {/* View mode + filters */}
      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
        {(["grid", "list", "kanban", "timeline"] as ViewMode[]).map(v => (
          <button key={v} onClick={() => setView(v)} className={`onyx-filter-pill${view === v ? " active" : ""}`}>
            <span style={{ marginRight: "5px", opacity: 0.7 }}>◇</span>{v.charAt(0).toUpperCase() + v.slice(1)}
          </button>
        ))}
        <div style={{ width: "1px", height: "18px", background: "var(--color-nicom-border-strong)", margin: "0 6px" }} />
        <input placeholder="filter sku…" value={sku} onChange={e => setSku(e.target.value)} className="onyx-input" style={{ width: "180px" }} />
        <select value={format} onChange={e => setFormat(e.target.value)} className="onyx-select" style={{ width: "150px" }}>
          {FORMATS.map(f => <option key={f} value={f}>{f || "all formats"}</option>)}
        </select>
        <button onClick={load} className="btn-onyx-ghost">↻ Refresh</button>
      </div>

      {err && <div className="onyx-callout onyx-callout-danger">{err}</div>}

      {view === "grid"     && <GridView />}
      {view === "list"     && <ListView />}
      {view === "kanban"   && <KanbanView />}
      {view === "timeline" && <TimelineView />}

      {/* Lightbox */}
      {selected && (
        <div className="onyx-modal-backdrop" onClick={() => setSelected(null)}>
          <div className="onyx-modal" style={{ maxHeight: "90vh", width: "min(1100px, 96vw)", overflowY: "auto", padding: "28px", display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: "24px", alignItems: "start" }} onClick={e => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={selected.url} alt={selected.filename} style={{ width: "100%", maxHeight: "70vh", objectFit: "contain", borderRadius: "8px" }} />
            <div className="space-y-3" style={{ fontSize: "13px", color: "var(--color-nicom-muted)" }}>
              <h3 style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: "18px", color: "var(--color-nicom-text)", marginBottom: "12px" }}>{selected.filename}</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", fontSize: "11px" }}>
                {[["SKU", selected.sku||"—"],["Format",selected.format||"—"],["Size",`${selected.size_kb} KB`],["Source",selected.source]].map(([l,v]) => (
                  <div key={l} style={{ borderRadius: "6px", background: "var(--color-nicom-elev)", padding: "8px", border: "0.5px solid var(--color-nicom-border)" }}>
                    <div style={{ color: "var(--color-nicom-faint)" }}>{l}</div>
                    <div style={{ fontWeight: 600, color: "var(--color-nicom-text)" }}>{v}</div>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: "11px", color: "var(--color-nicom-faint)" }}>Created: {new Date(selected.modified_at).toLocaleString()}</div>
              {selected.prompt_log && (
                <div style={{ fontSize: "11px" }}>
                  <div style={{ marginBottom: "4px", color: "var(--color-nicom-faint)" }}>Prompt:</div>
                  <code className="nicom-mono" style={{ display: "block", wordBreak: "break-all", borderRadius: "4px", background: "var(--color-nicom-elev)", padding: "8px", color: "var(--color-nicom-faint)", fontSize: "10px" }}>{selected.prompt_log}</code>
                </div>
              )}
              <div style={{ display: "flex", gap: "8px", paddingTop: "8px" }}>
                <a href={selected.url} download={selected.filename} className="btn-onyx-primary">Download</a>
                <a href={`/generate?sku=${selected.sku||""}&format=${selected.format||""}`} className="btn-onyx-ghost">Re-generate</a>
                <button onClick={() => setSelected(null)} className="btn-onyx-ghost">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
