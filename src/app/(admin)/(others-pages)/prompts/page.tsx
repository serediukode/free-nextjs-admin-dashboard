"use client";
import { useCallback, useEffect, useState } from "react";

const SKUS = [
  "vika-deep-blue","vika-ice-cool","vika-strawberry-mojito",
  "vika-frozen-mint","vika-cherry-berry","vika-strawberry-ice",
  "sober-slim-red","pablo-ice-cold","pablo-excl-frosted-ice","pablo-excl-dark-cherry",
];
const FORMATS = ["ig_post","ig_stories","ig_reel","tiktok","carousel","reels_seed","_default"];
const FORMAT_LABELS: Record<string,string> = {
  ig_post: "IG Post", ig_stories: "IG Stories", ig_reel: "IG Reel",
  tiktok: "TikTok", carousel: "Carousel", reels_seed: "Reels Seed", _default: "Default (fallback)",
};

type Library = Record<string, Record<string, string>>;

export default function PromptsPage() {
  const [library, setLibrary] = useState<Library>({});
  const [selected, setSelected] = useState<{ sku: string; format: string } | null>(null);
  const [text, setText] = useState("");
  const [saved, setSaved] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [newFormat, setNewFormat] = useState("");
  const [addingSku, setAddingSku] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/prompts", { cache: "no-store" });
      const d = await res.json();
      setLibrary(d.library || {});
    } catch (e) { setErr(String(e)); }
  }, []);

  useEffect(() => { load(); }, [load]);

  function selectEntry(sku: string, format: string) {
    if (!saved && !confirm("You have unsaved changes. Discard?")) return;
    setSelected({ sku, format });
    setText(library[sku]?.[format] || "");
    setSaved(true);
    setErr(null);
  }

  async function save() {
    if (!selected) return;
    setBusy(true);
    try {
      const res = await fetch("/api/prompts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sku: selected.sku, format: selected.format, text }),
      });
      if (!res.ok) throw new Error(await res.text());
      setSaved(true);
      setLibrary(prev => {
        const next = { ...prev };
        if (!next[selected.sku]) next[selected.sku] = {};
        next[selected.sku] = { ...next[selected.sku], [selected.format]: text };
        return next;
      });
    } catch (e) { setErr(String(e)); }
    finally { setBusy(false); }
  }

  async function deleteEntry() {
    if (!selected) return;
    if (!confirm(`Delete prompt for ${selected.sku} / ${selected.format}?`)) return;
    setBusy(true);
    try {
      await fetch("/api/prompts", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sku: selected.sku, format: selected.format }),
      });
      setLibrary(prev => {
        const next = { ...prev };
        if (next[selected.sku]) {
          const sk = { ...next[selected.sku] };
          delete sk[selected.format];
          if (Object.keys(sk).length === 0) delete next[selected.sku];
          else next[selected.sku] = sk;
        }
        return next;
      });
      setSelected(null); setText(""); setSaved(true);
    } catch (e) { setErr(String(e)); }
    finally { setBusy(false); }
  }

  async function addFormat() {
    const sku = addingSku || selected?.sku;
    const fmt = newFormat.trim().toLowerCase().replace(/\s+/g,"_");
    if (!sku || !fmt) return;
    await fetch("/api/prompts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sku, format: fmt, text: "" }),
    });
    await load();
    setSelected({ sku, format: fmt });
    setText(""); setSaved(true); setNewFormat(""); setAddingSku("");
  }

  const allSkus = [...new Set([...SKUS, ...Object.keys(library)])];

  return (
    <div className="onyx-page" style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: "20px", height: "calc(100vh - 180px)", minHeight: "500px" }}>

      {/* LEFT: SKU tree */}
      <div style={{ overflow: "auto", borderRight: "0.5px solid var(--color-nicom-border)", paddingRight: "16px" }}>
        <div style={{ marginBottom: "16px" }}>
          <p className="onyx-eyebrow mb-1">Prompt Library</p>
          <p style={{ fontSize: "11px", color: "var(--color-nicom-faint)" }}>{Object.values(library).reduce((n, f) => n + Object.keys(f).filter(k => !k.startsWith("_")).length, 0)} prompts across {Object.keys(library).length} SKUs</p>
        </div>

        {allSkus.map(sku => {
          const formats = library[sku] ? Object.keys(library[sku]).filter(k => k !== "_meta") : [];
          const hasFormats = formats.length > 0;
          return (
            <div key={sku} style={{ marginBottom: "8px" }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--color-nicom-faint)", letterSpacing: "1px", textTransform: "uppercase", padding: "4px 0", borderBottom: "0.5px solid var(--color-nicom-border)", marginBottom: "4px" }}>
                {sku}
              </div>
              {hasFormats ? formats.filter(f => f !== "_meta").map(fmt => (
                <button key={fmt} onClick={() => selectEntry(sku, fmt)}
                  style={{
                    display: "block", width: "100%", textAlign: "left",
                    padding: "5px 8px", borderRadius: "4px", fontSize: "11px",
                    fontFamily: "var(--font-mono)", letterSpacing: "0.5px",
                    background: selected?.sku === sku && selected?.format === fmt ? "rgba(199,154,76,0.12)" : "transparent",
                    color: selected?.sku === sku && selected?.format === fmt ? "var(--color-pablo)" : "var(--color-nicom-muted)",
                    borderLeft: selected?.sku === sku && selected?.format === fmt ? "2px solid var(--color-pablo)" : "2px solid transparent",
                    cursor: "pointer",
                  }}>
                  {FORMAT_LABELS[fmt] || fmt}
                  {fmt.startsWith("_") && <span style={{ color: "var(--color-nicom-dim)", fontSize: "9px", marginLeft: "4px" }}>fallback</span>}
                </button>
              )) : (
                <div style={{ fontSize: "10px", color: "var(--color-nicom-dim)", padding: "3px 8px" }}>no prompts yet</div>
              )}
            </div>
          );
        })}

        {/* Add new format */}
        <div style={{ marginTop: "16px", padding: "12px", background: "var(--color-nicom-elev)", borderRadius: "6px", border: "0.5px solid var(--color-nicom-border)" }}>
          <div className="onyx-h3 mb-2">Add prompt</div>
          <select value={addingSku || selected?.sku || ""} onChange={e => setAddingSku(e.target.value)}
            style={{ width: "100%", marginBottom: "6px", padding: "6px 8px", background: "var(--color-nicom-bg)", border: "0.5px solid var(--color-nicom-border)", borderRadius: "4px", color: "var(--color-nicom-text)", fontFamily: "var(--font-mono)", fontSize: "11px" }}>
            <option value="">— SKU —</option>
            {allSkus.map(s => <option key={s}>{s}</option>)}
          </select>
          <select value={newFormat} onChange={e => setNewFormat(e.target.value)}
            style={{ width: "100%", marginBottom: "8px", padding: "6px 8px", background: "var(--color-nicom-bg)", border: "0.5px solid var(--color-nicom-border)", borderRadius: "4px", color: "var(--color-nicom-text)", fontFamily: "var(--font-mono)", fontSize: "11px" }}>
            <option value="">— Format —</option>
            {FORMATS.map(f => <option key={f} value={f}>{FORMAT_LABELS[f] || f}</option>)}
          </select>
          <button onClick={addFormat} className="btn-onyx-primary"
            style={{ width: "100%", padding: "7px", fontSize: "10px", justifyContent: "center" }}>
            + Add
          </button>
        </div>
      </div>

      {/* RIGHT: editor */}
      <div style={{ display: "flex", flexDirection: "column", minHeight: 0 }}>
        {selected ? (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <div>
                <h1 style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: "22px", color: "var(--color-nicom-text)", letterSpacing: "-0.3px" }}>
                  {FORMAT_LABELS[selected.format] || selected.format}
                </h1>
                <div className="nicom-mono" style={{ fontSize: "10px", color: "var(--color-nicom-faint)", marginTop: "2px" }}>
                  {selected.sku} · {text.length} chars · {text.split(/\s+/).filter(Boolean).length} words
                </div>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                {!saved && (
                  <button disabled={busy} onClick={save} className="btn-onyx-primary"
                    style={{ padding: "7px 14px", fontSize: "10px" }}>
                    {busy ? "Saving…" : "✓ Save"}
                  </button>
                )}
                {saved && <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--color-ok)" }}>✓ Saved</span>}
                <button onClick={deleteEntry} className="btn-onyx-danger"
                  style={{ padding: "7px 12px", fontSize: "10px" }}>
                  Delete
                </button>
              </div>
            </div>

            {err && <div className="onyx-callout onyx-callout-danger" style={{ marginBottom: "8px" }}>{err}</div>}

            <textarea
              value={text}
              onChange={e => { setText(e.target.value); setSaved(false); }}
              onKeyDown={e => { if ((e.metaKey || e.ctrlKey) && e.key === "s") { e.preventDefault(); save(); } }}
              style={{
                flex: 1,
                width: "100%",
                padding: "16px",
                background: "var(--color-nicom-bg)",
                border: `0.5px solid ${saved ? "var(--color-nicom-border)" : "var(--color-pablo)"}`,
                borderRadius: "8px",
                color: "var(--color-nicom-text)",
                fontFamily: "var(--font-mono)",
                fontSize: "12px",
                lineHeight: "1.7",
                resize: "none",
                outline: "none",
                boxSizing: "border-box",
              }}
              placeholder="Enter image generation prompt…"
            />
            <div style={{ marginTop: "6px", fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--color-nicom-faint)" }}>
              ⌘S to save · This prompt is used by the pipeline when generating {FORMAT_LABELS[selected.format] || selected.format} for {selected.sku}
            </div>
          </>
        ) : (
          <div style={{ display: "flex", flex: 1, alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "12px" }}>
            <h1 style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: "32px", letterSpacing: "-0.3px", color: "var(--color-nicom-text)", marginBottom: "4px" }}>Prompt Library</h1>
            <p style={{ color: "var(--color-nicom-muted)", fontSize: "13px", textAlign: "center", maxWidth: "400px" }}>
              Select a SKU · format from the left panel to view and edit the image generation prompt. Prompts are stored in <code className="nicom-mono">brand-data/prompt-library.json</code> and used by the pipeline.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
