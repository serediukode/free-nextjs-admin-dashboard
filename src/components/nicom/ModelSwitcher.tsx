"use client";

import { useEffect, useState } from "react";

type Data = {
  config: Record<string, string>;
  defaults: Record<string, string>;
  overrides: Record<string, string>;
  available: string[];
};

const TASK_LABELS: Record<string, string> = {
  prompt_generate: "Prompt (image input)",
  caption_generate: "Caption",
  brief_generate: "Brief / strategy",
  compliance_check: "Compliance check",
  hashtag_generate: "Hashtags",
  quality_check: "Quality check",
  caption_rewrite: "Caption rewrite",
  research: "Research",
  trend_analysis: "Trend analysis",
  competitor_monitor: "Competitor monitor",
};

const FREE_MODELS = new Set(["llama3.2:3b", "llama3.1:8b", "mistral:7b"]);

export default function ModelSwitcher() {
  const [data, setData] = useState<Data | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    try {
      const r = await fetch("/api/models", { cache: "no-store" });
      setData(await r.json());
    } catch (e) {
      setErr(String(e));
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function setModel(task: string, model: string) {
    setBusy(task);
    try {
      const r = await fetch("/api/models", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task, model }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j.error || `HTTP ${r.status}`);
      }
      await load();
    } catch (e) {
      setErr(String(e));
    } finally {
      setBusy(null);
    }
  }

  if (err) return <div className="text-sm text-[var(--color-danger)]">Error: {err}</div>;
  if (!data) return <div className="text-sm text-[var(--color-nicom-faint)]">Loading models…</div>;

  return (
    <div className="nicom-surface p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-nicom-faint)]">
          Model routing (cost optimization)
        </h3>
        <span className="text-xs text-[var(--color-nicom-faint)]">
          {Object.keys(data.overrides).length} override
          {Object.keys(data.overrides).length === 1 ? "" : "s"}
        </span>
      </div>
      <table className="w-full text-sm">
        <thead className="text-left text-[10px] uppercase tracking-wider text-[var(--color-nicom-faint)]">
          <tr>
            <th className="pb-2 font-medium">Task</th>
            <th className="pb-2 font-medium">Active model</th>
            <th className="pb-2 font-medium">Default</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(data.config).map(([task, model]) => {
            const isDefault = model === data.defaults[task];
            const isFree = FREE_MODELS.has(model);
            return (
              <tr key={task} className="border-t border-[var(--color-nicom-hairline)]">
                <td className="py-2 text-[var(--color-nicom-text)]">{TASK_LABELS[task] || task}</td>
                <td className="py-2">
                  <div className="flex items-center gap-2">
                    <select
                      value={model}
                      disabled={busy === task}
                      onChange={(e) => setModel(task, e.target.value)}
                      className="rounded border border-[var(--color-nicom-border)] bg-[var(--color-nicom-elev)] px-2 py-1 text-xs text-[var(--color-nicom-text)]"
                    >
                      {data.available.map((m) => (
                        <option key={m}>{m}</option>
                      ))}
                    </select>
                    {isFree && (
                      <span className="nicom-chip nicom-chip-ok">FREE</span>
                    )}
                    {!isDefault && (
                      <span className="nicom-chip nicom-chip-warn">override</span>
                    )}
                  </div>
                </td>
                <td className="py-2 text-xs text-[var(--color-nicom-faint)]">{data.defaults[task]}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="mt-3 text-xs text-[var(--color-nicom-faint)]">
        Writes to <code className="nicom-mono">.model-config.json</code>. FREE = local Ollama. Restart daemon to apply.
      </p>
    </div>
  );
}
