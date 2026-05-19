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

  if (err) return <div className="text-sm text-rose-500">Error: {err}</div>;
  if (!data) return <div className="text-sm">Loading models…</div>;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
          Model routing (cost optimization)
        </h3>
        <span className="text-xs text-gray-500">
          {Object.keys(data.overrides).length} override
          {Object.keys(data.overrides).length === 1 ? "" : "s"}
        </span>
      </div>
      <table className="w-full text-sm">
        <thead className="text-left text-xs uppercase tracking-wide text-gray-500">
          <tr>
            <th className="pb-2">Task</th>
            <th className="pb-2">Active model</th>
            <th className="pb-2">Default</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(data.config).map(([task, model]) => {
            const isDefault = model === data.defaults[task];
            const isFree = FREE_MODELS.has(model);
            return (
              <tr key={task} className="border-t border-gray-100 dark:border-gray-800">
                <td className="py-2">{TASK_LABELS[task] || task}</td>
                <td className="py-2">
                  <div className="flex items-center gap-2">
                    <select
                      value={model}
                      disabled={busy === task}
                      onChange={(e) => setModel(task, e.target.value)}
                      className="rounded border border-gray-200 bg-white px-2 py-1 text-xs dark:border-gray-700 dark:bg-gray-800"
                    >
                      {data.available.map((m) => (
                        <option key={m}>{m}</option>
                      ))}
                    </select>
                    {isFree && (
                      <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] text-emerald-700">
                        FREE
                      </span>
                    )}
                    {!isDefault && (
                      <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] text-amber-700">
                        override
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-2 text-xs text-gray-500">{data.defaults[task]}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="mt-3 text-xs text-gray-500">
        Writes to <code>.model-config.json</code>. FREE = local Ollama. Restart daemon to apply.
      </p>
    </div>
  );
}
