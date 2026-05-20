"use client";

import { useEffect, useState, useCallback } from "react";
import ContentPlanCalendar from "@/components/nicom/ContentPlanCalendar";

type Item = {
  id: string; title: string; sku: string; channel: string;
  brand: string; status: string; brief: string; headline: string;
  date: string; last_edited: string;
};

type View = "calendar" | "table" | "kanban" | "timeline";

const STATUSES = ["In Brief", "Approved", "In Production", "Published", "Rejected"];
const BRANDS   = ["VIKA Main", "VIKA Slim", "SBR", "Pablo"];
const CHANNELS = ["IG Post", "IG Stories", "IG Reel", "TikTok", "Carousel", "Reels Seed"];

const SKUS = [
  "vika-deep-blue","vika-ice-cool","vika-strawberry-mojito",
  "vika-frozen-mint","vika-cherry-berry","vika-strawberry-ice",
  "sober-slim-red","pablo-ice-cold","pablo-excl-frosted-ice","pablo-excl-dark-cherry",
];

const STATUS_COLOR: Record<string, string> = {
  "In Brief":      "onyx-pill-warn",
  "Approved":      "onyx-pill-ok",
  "In Production": "onyx-pill",
  "Published":     "onyx-pill-ok",
  "Rejected":      "onyx-pill-danger",
};

const BRAND_COLOR: Record<string, string> = {
  "VIKA Main": "#5b9bd5",
  "VIKA Slim": "#5b9bd5",
  "SBR":       "#a32d2d",
  "Pablo":     "#c79a4c",
};

function brandBorder(brand: string) {
  return { borderLeft: `2px solid ${BRAND_COLOR[brand] || "rgba(255,255,255,0.12)"}` };
}

const VIEW_LABELS: { id: View; label: string }[] = [
  { id: "calendar", label: "Calendar" },
  { id: "table",    label: "Table" },
  { id: "kanban",   label: "Kanban" },
  { id: "timeline", label: "Timeline" },
];

const KANBAN_COLS = ["In Brief", "Approved", "In Production", "Published", "Rejected"];

const CHANNEL_FORMAT: Record<string, string> = {
  "IG Stories": "ig_stories",
  "IG Post":    "ig_post",
  "IG Reel":    "ig_reel",
  "TikTok":     "tiktok",
  "Carousel":   "carousel",
  "Reels Seed": "reels_seed",
};

export default function ContentPlanPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [err, setErr]     = useState<string | null>(null);
  const [view, setView]   = useState<View>("calendar");
  const [filterBrand,   setFilterBrand]   = useState("all");
  const [filterStatus,  setFilterStatus]  = useState("all");
  const [filterChannel, setFilterChannel] = useState("all");
  const [selected, setSelected] = useState<Item | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  // CRUD state
  const [editing, setEditing]   = useState<Item | null>(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [genItem, setGenItem]   = useState<Item | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/content-plan", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      setItems(json.items || []);
      setErr(null);
    } catch (e) { setErr(String(e)); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = items.filter(it => {
    if (filterBrand   !== "all" && it.brand   !== filterBrand)   return false;
    if (filterStatus  !== "all" && it.status  !== filterStatus)  return false;
    if (filterChannel !== "all" && it.channel !== filterChannel) return false;
    return true;
  });

  async function setStatus(item: Item, status: string) {
    setBusy(item.id);
    try {
      const res = await fetch("/api/notion/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ page_id: item.id, status }),
      });
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      // Show warning if dispatch failed (Notion updated but publish didn't fire)
      if (status === "Approved" && json.dispatched === false && json.dispatchError) {
        setErr(`⚠ Approved in Notion but publish dispatch failed: ${json.dispatchError}. Check N8N_PUBLISH_WEBHOOK_URL in settings.`);
      }
      await load();
      if (selected?.id === item.id) setSelected({ ...item, status });
    } catch (e) { setErr(String(e)); }
    finally { setBusy(null); }
  }

  async function saveItem(item: Item) {
    setSaving(true);
    try {
      const res = await fetch("/api/content-plan", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!res.ok) throw new Error(await res.text());
      await load();
      setEditing(null);
      setSelected(null);
    } catch (e) { setErr(String(e)); }
    finally { setSaving(false); }
  }

  async function createItem(item: Partial<Item>) {
    setSaving(true);
    try {
      const res = await fetch("/api/content-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!res.ok) throw new Error(await res.text());
      await load();
      setCreating(false);
    } catch (e) { setErr(String(e)); }
    finally { setSaving(false); }
  }

  function FilterPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
    return (
      <button
        onClick={onClick}
        className={`onyx-filter-pill${active ? " active" : ""}`}
      >{label}</button>
    );
  }

  // ── TABLE VIEW ──
  function TableView() {
    return (
      <div className="onyx-panel overflow-hidden">
        <table className="onyx-table">
          <thead>
            <tr>
              {["Title", "SKU", "Channel", "Brand", "Status", "Date", "Actions"].map(h => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="onyx-stagger">
            {filtered.length === 0 && (
              <tr><td colSpan={7} style={{ textAlign: "center", color: "var(--color-nicom-faint)", padding: "32px" }}>No entries match this filter.</td></tr>
            )}
            {filtered.map(it => (
              <tr key={it.id} className="onyx-row" onClick={() => setEditing(it)}>
                <td style={{ ...brandBorder(it.brand), paddingLeft: "18px", color: "var(--color-nicom-text)" }}>{it.title || "(untitled)"}</td>
                <td><span className="nicom-mono" style={{ color: "var(--color-nicom-faint)", fontSize: "11px" }}>{it.sku}</span></td>
                <td style={{ color: "var(--color-nicom-muted)" }}>{it.channel}</td>
                <td style={{ color: "var(--color-nicom-muted)" }}>{it.brand}</td>
                <td><span className={`onyx-pill ${STATUS_COLOR[it.status] || "onyx-pill-faint"}`}>{it.status || "—"}</span></td>
                <td><span className="nicom-mono" style={{ color: "var(--color-nicom-faint)", fontSize: "11px" }}>{it.date || "—"}</span></td>
                <td onClick={e => e.stopPropagation()}>
                  <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                    <button disabled={busy === it.id} className="btn-onyx-ghost" style={{ padding: "4px 10px", fontSize: "9px" }}
                      onClick={() => { window.location.href = `/generate?sku=${it.sku}&format=${CHANNEL_FORMAT[it.channel] || "ig_post"}`; }}>
                      Generate
                    </button>
                    <button disabled={busy === it.id} className="btn-onyx-success" style={{ padding: "4px 10px", fontSize: "9px" }}
                      onClick={() => setStatus(it, "Approved")}>✓</button>
                    <button disabled={busy === it.id} className="btn-onyx-danger" style={{ padding: "4px 10px", fontSize: "9px" }}
                      onClick={() => setStatus(it, "Rejected")}>✕</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // ── KANBAN VIEW ──
  function KanbanView() {
    return (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: "14px" }}>
        {KANBAN_COLS.map(col => {
          const cards = filtered.filter(it => it.status === col);
          return (
            <div key={col}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "8px", marginBottom: "12px", borderBottom: "0.5px solid var(--color-nicom-border-strong)", fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--color-nicom-faint)", letterSpacing: "1.5px", textTransform: "uppercase" }}>
                <span>{col}</span>
                <span style={{ color: "var(--color-pablo)", fontWeight: 600 }}>{cards.length}</span>
              </div>
              <div className="onyx-stagger">
                {cards.map(it => (
                  <div
                    key={it.id}
                    className="onyx-card-nudge"
                    onClick={() => setEditing(it)}
                    style={{ background: "rgba(255,255,255,0.02)", border: "0.5px solid var(--color-nicom-border)", borderRadius: "5px", padding: "10px 12px", marginBottom: "8px", cursor: "pointer", ...brandBorder(it.brand) }}
                  >
                    <div style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: "14px", color: "var(--color-nicom-text)", letterSpacing: "-0.2px", marginBottom: "6px", lineHeight: "1.25" }}>
                      {it.title || "(untitled)"}
                    </div>
                    <div className="nicom-mono" style={{ fontSize: "9px", color: "var(--color-nicom-faint)", letterSpacing: "1px", textTransform: "uppercase" }}>
                      {it.sku}
                    </div>
                    <div style={{ marginTop: "8px", display: "flex", gap: "4px", flexWrap: "wrap" }}>
                      <span className="onyx-pill" style={{ fontSize: "8.5px" }}>{it.channel}</span>
                      <span className={`onyx-pill ${it.brand === "Pablo" ? "onyx-pill-pablo" : it.brand === "SBR" ? "onyx-pill-sbr" : "onyx-pill-vika"}`} style={{ fontSize: "8.5px" }}>{it.brand}</span>
                    </div>
                    {it.date && <div className="nicom-mono" style={{ fontSize: "9px", color: "var(--color-nicom-dim)", marginTop: "6px" }}>{it.date}</div>}
                  </div>
                ))}
                {cards.length === 0 && (
                  <div style={{ border: "1px dashed var(--color-nicom-border)", borderRadius: "5px", padding: "20px 12px", textAlign: "center", fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--color-nicom-dim)", letterSpacing: "1px", textTransform: "uppercase" }}>Empty</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // ── TIMELINE VIEW ──
  function TimelineView() {
    const dated = filtered.filter(it => it.date).sort((a, b) => a.date.localeCompare(b.date));
    const undated = filtered.filter(it => !it.date);
    const groups: Record<string, Item[]> = {};
    for (const it of dated) {
      if (!groups[it.date]) groups[it.date] = [];
      groups[it.date].push(it);
    }
    const dates = Object.keys(groups).sort();

    return (
      <div style={{ position: "relative", paddingLeft: "32px" }}>
        <div style={{ position: "absolute", left: "10px", top: "20px", bottom: "20px", width: "1px", background: "rgba(255,255,255,0.08)" }} />
        <div className="onyx-stagger">
          {dates.map(d => (
            <div key={d} style={{ marginBottom: "28px", position: "relative" }}>
              <div style={{ position: "absolute", left: "-27px", top: "4px", width: "11px", height: "11px", borderRadius: "50%", background: "var(--color-nicom-bg)", border: "1.5px solid var(--color-pablo)" }} />
              <div className="onyx-eyebrow" style={{ marginBottom: "10px", color: "var(--color-pablo)" }}>
                {new Date(d).toLocaleDateString("uk-UA", { weekday: "short", day: "numeric", month: "short", year: "numeric" }).toUpperCase()}
              </div>
              {groups[d].map(it => (
                <div
                  key={it.id}
                  className="onyx-row"
                  onClick={() => setEditing(it)}
                  style={{ display: "grid", gridTemplateColumns: "28px 1fr auto", gap: "14px", alignItems: "center", padding: "12px 14px", marginBottom: "5px", background: "rgba(255,255,255,0.02)", borderRadius: "6px", ...brandBorder(it.brand) }}
                >
                  <div style={{ width: "28px", height: "28px", borderRadius: "4px", background: BRAND_COLOR[it.brand] || "var(--color-nicom-elev)" }} />
                  <div>
                    <div style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: "15px", color: "var(--color-nicom-text)", letterSpacing: "-0.2px" }}>{it.title || "(untitled)"}</div>
                    <div className="nicom-mono" style={{ fontSize: "9px", color: "var(--color-nicom-faint)", letterSpacing: "1px", textTransform: "uppercase", marginTop: "2px" }}>{it.sku} · {it.channel} · {it.brand}</div>
                  </div>
                  <span className={`onyx-pill ${STATUS_COLOR[it.status] || "onyx-pill-faint"}`} style={{ fontSize: "8.5px" }}>{it.status || "—"}</span>
                </div>
              ))}
            </div>
          ))}
          {undated.length > 0 && (
            <div style={{ marginBottom: "28px", position: "relative" }}>
              <div style={{ position: "absolute", left: "-27px", top: "4px", width: "11px", height: "11px", borderRadius: "50%", background: "var(--color-nicom-bg)", border: "1.5px solid var(--color-nicom-border-strong)" }} />
              <div className="onyx-eyebrow" style={{ marginBottom: "10px" }}>Undated</div>
              {undated.map(it => (
                <div key={it.id} className="onyx-row" onClick={() => setEditing(it)}
                  style={{ display: "grid", gridTemplateColumns: "28px 1fr auto", gap: "14px", alignItems: "center", padding: "12px 14px", marginBottom: "5px", background: "rgba(255,255,255,0.02)", borderRadius: "6px", ...brandBorder(it.brand) }}>
                  <div style={{ width: "28px", height: "28px", borderRadius: "4px", background: BRAND_COLOR[it.brand] || "var(--color-nicom-elev)" }} />
                  <div>
                    <div style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: "15px", color: "var(--color-nicom-text)" }}>{it.title || "(untitled)"}</div>
                    <div className="nicom-mono" style={{ fontSize: "9px", color: "var(--color-nicom-faint)", letterSpacing: "1px", textTransform: "uppercase", marginTop: "2px" }}>{it.sku} · {it.channel} · {it.brand}</div>
                  </div>
                  <span className={`onyx-pill ${STATUS_COLOR[it.status] || "onyx-pill-faint"}`} style={{ fontSize: "8.5px" }}>{it.status || "—"}</span>
                </div>
              ))}
            </div>
          )}
          {dates.length === 0 && undated.length === 0 && (
            <div style={{ textAlign: "center", color: "var(--color-nicom-faint)", fontFamily: "var(--font-mono)", fontSize: "11px", padding: "40px 0" }}>No entries.</div>
          )}
        </div>
      </div>
    );
  }

  // ── DETAIL / EDIT MODAL ──
  function DetailModal() {
    if (!editing) return null;
    const item = editing;
    const [draft, setDraft] = useState<Item>({ ...item });
    const isDirty = JSON.stringify(draft) !== JSON.stringify(item);

    function field(label: string, key: keyof Item, type: "text" | "textarea" | "select", opts?: string[]) {
      return (
        <div key={key} style={{ marginBottom: "12px" }}>
          <div className="onyx-h3 mb-1">{label}</div>
          {type === "textarea" ? (
            <textarea value={String(draft[key] || "")} rows={3}
              onChange={e => setDraft(d => ({ ...d, [key]: e.target.value }))}
              style={{ width: "100%", padding: "8px 12px", background: "var(--color-nicom-elev)", border: "0.5px solid var(--color-nicom-border)", borderRadius: "4px", color: "var(--color-nicom-text)", fontFamily: "var(--font-mono)", fontSize: "12px", resize: "vertical", boxSizing: "border-box" }} />
          ) : type === "select" && opts ? (
            <select value={String(draft[key] || "")} onChange={e => setDraft(d => ({ ...d, [key]: e.target.value }))} className="onyx-select" style={{ width: "100%" }}>
              <option value="">—</option>
              {opts.map(o => <option key={o}>{o}</option>)}
            </select>
          ) : (
            <input type={key === "date" ? "date" : "text"} value={String(draft[key] || "")}
              onChange={e => setDraft(d => ({ ...d, [key]: e.target.value }))}
              style={{ width: "100%", padding: "8px 12px", background: "var(--color-nicom-elev)", border: "0.5px solid var(--color-nicom-border)", borderRadius: "4px", color: "var(--color-nicom-text)", fontFamily: "var(--font-mono)", fontSize: "12px", boxSizing: "border-box" }} />
          )}
        </div>
      );
    }

    return (
      <div className="onyx-modal-backdrop" onClick={() => { setSelected(null); setEditing(null); }}>
        <div className="onyx-modal" style={{ width: "min(640px,96vw)", maxHeight: "90vh", overflow: "auto", padding: "24px" }}
          onClick={e => e.stopPropagation()}>

          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px", borderBottom: "0.5px solid var(--color-nicom-border)", paddingBottom: "16px" }}>
            <div>
              <h2 style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: "20px", color: "var(--color-nicom-text)", letterSpacing: "-0.3px" }}>{draft.title || "(untitled)"}</h2>
              <div className="nicom-mono" style={{ fontSize: "10px", color: "var(--color-nicom-faint)", marginTop: "4px" }}>{draft.sku} · {draft.channel} · {draft.brand}</div>
            </div>
            <button className="btn-onyx-ghost" style={{ padding: "6px 12px", fontSize: "14px" }}
              onClick={() => { setSelected(null); setEditing(null); }}>✕</button>
          </div>

          {/* Fields */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
            <div>
              {field("Title", "title", "text")}
              {field("SKU", "sku", "select", SKUS)}
              {field("Channel", "channel", "select", CHANNELS)}
              {field("Brand", "brand", "select", BRANDS)}
            </div>
            <div>
              {field("Status", "status", "select", STATUSES)}
              {field("Date", "date", "text")}
              {field("Headline UA", "headline", "text")}
            </div>
          </div>
          {field("Brief", "brief", "textarea")}

          {/* Actions */}
          <div style={{ display: "flex", gap: "8px", marginTop: "16px", flexWrap: "wrap" }}>
            {isDirty && (
              <button disabled={saving} onClick={() => saveItem(draft)} className="btn-onyx-primary"
                style={{ padding: "8px 18px", fontSize: "10px" }}>
                {saving ? "Saving…" : "✓ Save changes"}
              </button>
            )}
            <button onClick={() => { setGenItem(draft); setSelected(null); setEditing(null); }}
              className="btn-onyx-ghost" style={{ padding: "8px 18px", fontSize: "10px" }}>
              ◇ Generate
            </button>
            <button onClick={() => { setEditing(null); setSelected(null); }} className="btn-onyx-ghost"
              style={{ padding: "8px 14px", fontSize: "10px" }}>
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── NEW POST MODAL ──
  function NewPostModal() {
    const [draft, setDraft] = useState<Partial<Item>>({ status: "In Brief", brand: "VIKA Main", channel: "IG Post" });

    function field(label: string, key: string, type: "text" | "textarea" | "select", opts?: string[]) {
      const val = (draft as Record<string, string>)[key] || "";
      return (
        <div key={key} style={{ marginBottom: "12px" }}>
          <div className="onyx-h3 mb-1">{label}</div>
          {type === "textarea" ? (
            <textarea value={val} rows={3} onChange={e => setDraft(d => ({ ...d, [key]: e.target.value }))}
              style={{ width: "100%", padding: "8px 12px", background: "var(--color-nicom-elev)", border: "0.5px solid var(--color-nicom-border)", borderRadius: "4px", color: "var(--color-nicom-text)", fontFamily: "var(--font-mono)", fontSize: "12px", resize: "vertical", boxSizing: "border-box" }} />
          ) : type === "select" && opts ? (
            <select value={val} onChange={e => setDraft(d => ({ ...d, [key]: e.target.value }))} className="onyx-select" style={{ width: "100%" }}>
              <option value="">—</option>
              {opts.map(o => <option key={o}>{o}</option>)}
            </select>
          ) : (
            <input type={key === "date" ? "date" : "text"} value={val} onChange={e => setDraft(d => ({ ...d, [key]: e.target.value }))}
              style={{ width: "100%", padding: "8px 12px", background: "var(--color-nicom-elev)", border: "0.5px solid var(--color-nicom-border)", borderRadius: "4px", color: "var(--color-nicom-text)", fontFamily: "var(--font-mono)", fontSize: "12px", boxSizing: "border-box" }} />
          )}
        </div>
      );
    }

    return (
      <div className="onyx-modal-backdrop" onClick={() => setCreating(false)}>
        <div className="onyx-modal" style={{ width: "min(600px,96vw)", maxHeight: "90vh", overflow: "auto", padding: "24px" }}
          onClick={e => e.stopPropagation()}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", borderBottom: "0.5px solid var(--color-nicom-border)", paddingBottom: "16px" }}>
            <h2 style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: "20px", color: "var(--color-nicom-text)", letterSpacing: "-0.3px" }}>New Post</h2>
            <button className="btn-onyx-ghost" style={{ padding: "6px 12px" }} onClick={() => setCreating(false)}>✕</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
            <div>
              {field("Title", "title", "text")}
              {field("SKU", "sku", "select", SKUS)}
              {field("Channel", "channel", "select", CHANNELS)}
            </div>
            <div>
              {field("Brand", "brand", "select", BRANDS)}
              {field("Status", "status", "select", STATUSES)}
              {field("Date", "date", "text")}
            </div>
          </div>
          {field("Headline UA", "headline", "text")}
          {field("Brief", "brief", "textarea")}
          <div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
            <button disabled={saving || !draft.title} onClick={() => createItem(draft)} className="btn-onyx-primary"
              style={{ padding: "8px 18px", fontSize: "10px" }}>
              {saving ? "Creating…" : "+ Create post"}
            </button>
            <button onClick={() => setCreating(false)} className="btn-onyx-ghost"
              style={{ padding: "8px 14px", fontSize: "10px" }}>Cancel</button>
          </div>
        </div>
      </div>
    );
  }

  // ── GENERATE MODAL ──
  function GenerateModal() {
    if (!genItem) return null;
    const item = genItem;
    const [models, setModels] = useState<string[]>([]);
    const [model, setModel] = useState("gemini-2.5-flash");
    const [prompt, setPrompt] = useState(item.brief || item.headline || "");
    const [mode, setMode] = useState("local");
    const fmt = CHANNEL_FORMAT[item.channel] || "ig_post";

    useEffect(() => {
      fetch("/api/models", { cache: "no-store" }).then(r => r.json())
        .then(d => { if (d.available?.length) setModels(d.available); })
        .catch(() => {});
    }, []);

    async function launch() {
      try {
        sessionStorage.setItem("nicom-generate-session", JSON.stringify({
          sku: item.sku, format: fmt, lines: [], finishedCode: null, latest: null
        }));
      } catch {}
      // Save selected model override before navigating
      if (model) {
        try {
          await fetch("/api/models", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ task: "prompt_generate", model }),
          });
        } catch {}
      }
      window.location.href = `/generate?sku=${encodeURIComponent(item.sku)}&format=${fmt}`;
    }

    return (
      <div className="onyx-modal-backdrop" onClick={() => setGenItem(null)}>
        <div className="onyx-modal" style={{ width: "min(560px,96vw)", maxHeight: "90vh", overflow: "auto", padding: "24px" }}
          onClick={e => e.stopPropagation()}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", borderBottom: "0.5px solid var(--color-nicom-border)", paddingBottom: "12px" }}>
            <div>
              <h2 style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: "18px", color: "var(--color-nicom-text)" }}>Generate</h2>
              <div className="nicom-mono" style={{ fontSize: "10px", color: "var(--color-nicom-faint)", marginTop: "2px" }}>{item.sku} · {fmt}</div>
            </div>
            <button className="btn-onyx-ghost" style={{ padding: "6px 12px" }} onClick={() => setGenItem(null)}>✕</button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
            <div>
              <div className="onyx-h3 mb-1">Model</div>
              <select value={model} onChange={e => setModel(e.target.value)} className="onyx-select" style={{ width: "100%" }}>
                {models.length ? models.map(m => <option key={m}>{m}</option>) : <option>{model}</option>}
              </select>
            </div>
            <div>
              <div className="onyx-h3 mb-1">Approval mode</div>
              <select value={mode} onChange={e => setMode(e.target.value)} className="onyx-select" style={{ width: "100%" }}>
                {["local", "auto", "platform", "telegram"].map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
          </div>

          <div style={{ marginBottom: "16px" }}>
            <div className="onyx-h3 mb-1">Prompt / Brief <span style={{ color: "var(--color-nicom-dim)", fontWeight: 400 }}>(editable)</span></div>
            <textarea value={prompt} rows={5} onChange={e => setPrompt(e.target.value)}
              placeholder="Leave empty to use pipeline's auto-generated prompt from brand DNA"
              style={{ width: "100%", padding: "10px 12px", background: "var(--color-nicom-elev)", border: "0.5px solid var(--color-nicom-border)", borderRadius: "4px", color: "var(--color-nicom-text)", fontFamily: "var(--font-mono)", fontSize: "11px", resize: "vertical", lineHeight: 1.6, boxSizing: "border-box" }} />
            <div className="nicom-mono" style={{ fontSize: "9px", color: "var(--color-nicom-faint)", marginTop: "4px" }}>
              This brief is passed as context to the LangGraph pipeline
            </div>
          </div>

          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={launch} className="btn-onyx-primary" style={{ padding: "10px 20px", fontSize: "10px" }}>
              ▶ Run pipeline
            </button>
            <button onClick={() => setGenItem(null)} className="btn-onyx-ghost" style={{ padding: "10px 14px", fontSize: "10px" }}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="onyx-page space-y-6">
      {/* Page header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <p className="onyx-eyebrow mb-2">Content Plan · {filtered.length} entries</p>
          <h1 style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: "32px", letterSpacing: "-0.3px", color: "var(--color-nicom-text)", marginBottom: "8px" }}>Content Plan</h1>
          <p style={{ color: "var(--color-nicom-muted)", fontSize: "13px" }}>Notion Content Plan · {items.length} total · Calendar / Table / Kanban / Timeline</p>
        </div>
        <button onClick={() => setCreating(true)} className="btn-onyx-primary" style={{ padding: "10px 18px", fontSize: "10px", whiteSpace: "nowrap" }}>
          + New Post
        </button>
      </div>

      {/* View mode switcher */}
      <div style={{ display: "flex", gap: "6px" }}>
        {VIEW_LABELS.map(v => (
          <button key={v.id} onClick={() => setView(v.id)} className={`onyx-filter-pill${view === v.id ? " active" : ""}`}>
            <span style={{ marginRight: "5px", opacity: 0.7 }}>◇</span>{v.label}
          </button>
        ))}
      </div>

      {/* Filter bar */}
      <div className="onyx-filter-bar">
        <FilterPill label="All brands" active={filterBrand === "all"} onClick={() => setFilterBrand("all")} />
        {BRANDS.map(b => <FilterPill key={b} label={b} active={filterBrand === b} onClick={() => setFilterBrand(b)} />)}
        <div style={{ width: "1px", height: "18px", background: "var(--color-nicom-border-strong)", margin: "0 6px" }} />
        <FilterPill label="All status" active={filterStatus === "all"} onClick={() => setFilterStatus("all")} />
        {STATUSES.map(s => <FilterPill key={s} label={s} active={filterStatus === s} onClick={() => setFilterStatus(s)} />)}
        <div style={{ width: "1px", height: "18px", background: "var(--color-nicom-border-strong)", margin: "0 6px" }} />
        <FilterPill label="All channels" active={filterChannel === "all"} onClick={() => setFilterChannel("all")} />
        {CHANNELS.map(c => <FilterPill key={c} label={c} active={filterChannel === c} onClick={() => setFilterChannel(c)} />)}
        <button onClick={load} className="onyx-filter-pill" style={{ marginLeft: "auto" }}>↻ Refresh</button>
      </div>

      {err && <div className="onyx-callout onyx-callout-danger"><strong>Error:</strong> {err}</div>}

      {/* Views */}
      {view === "calendar"  && <ContentPlanCalendar externalItems={filtered} onSelect={(it) => setEditing(it as Item)} />}
      {view === "table"     && <TableView />}
      {view === "kanban"    && <KanbanView />}
      {view === "timeline"  && <TimelineView />}

      {/* Modals */}
      {editing  && <DetailModal />}
      {creating && <NewPostModal />}
      {genItem  && <GenerateModal />}
    </div>
  );
}
