"use client";

import { useEffect, useState } from "react";

type Agent = {
  id: string;
  name: string;
  role: string;
  description: string;
};

const AGENTS: Agent[] = [
  {
    id: "niko",
    name: "Niko",
    role: "Brand persona · content voice",
    description:
      "Бренд-голос для VIKA / SBR / Pablo. Працює через daemon `pipeline/agents/orchestrator.py` + LLM router (Claude Haiku для brief, Llama 3.1 для caption).",
  },
  {
    id: "research",
    name: "Research",
    role: "Market intelligence",
    description:
      "Daemon `pipeline/agents/market_intelligence.py` · читає competitor snapshots + reads з DeepSeek API · пише у state DB `market_intel`.",
  },
  {
    id: "compliance",
    name: "Compliance",
    role: "7-rule brand policy gate",
    description:
      "Pre-publish gate · 7 правил (legacy wordmark · heritage 1879 · 21+ · legal · manufacturer · open-pouch · channel-policy) · виконується через `pipeline/langgraph/compliance_gate.py`.",
  },
  {
    id: "competitor-monitor",
    name: "Competitor Monitor",
    role: "Daily competitor scrape",
    description:
      "`pipeline/agents/competitor_monitor.py` + Firecrawl · denoise → diff → alert. Daily cron.",
  },
  {
    id: "product-agent",
    name: "Product Agent",
    role: "Per-SKU brief + headline composer",
    description:
      "`pipeline/agents/product_agent.py` · читає `brand-data/products.json` + Content Plan · готує context-rich brief для Pletor.",
  },
  {
    id: "telegram-bot",
    name: "Telegram Bot",
    role: "Approval gate · operator notifications",
    description:
      "`pipeline/telegram-bot/bot.py` + launchd · approve/reject inline у Telegram · sync статусу назад у state DB.",
  },
];

type Heartbeat = { agent_id: string; ts: string; status: string };
type StatusResponse = {
  services?: { name: string; pid: number | null; alive: boolean }[];
  queue?: { lastHeartbeats?: Heartbeat[]; error?: string };
};

const statusBadge: Record<string, string> = {
  running: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  idle: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
  disabled: "bg-gray-500/10 text-gray-500 border-gray-500/30",
  unknown: "bg-gray-500/10 text-gray-500 border-gray-500/30",
};

function fmtAgo(iso?: string): string {
  if (!iso) return "—";
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "—";
  const diff = Date.now() - t;
  if (diff < 0) return "now";
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function deriveStatus(hb: Heartbeat | undefined): { label: string; color: string; lastSeen: string } {
  if (!hb) return { label: "idle", color: statusBadge.idle, lastSeen: "—" };
  const ageMs = Date.now() - new Date(hb.ts).getTime();
  if (ageMs > 5 * 60 * 1000) return { label: "idle", color: statusBadge.idle, lastSeen: fmtAgo(hb.ts) };
  return { label: hb.status || "running", color: statusBadge.running, lastSeen: fmtAgo(hb.ts) };
}

export default function AgentsPage() {
  const [data, setData] = useState<StatusResponse | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/status", { cache: "no-store" });
        const json = await res.json();
        if (!cancelled) {
          setData(json);
          setErr(null);
        }
      } catch (e) {
        if (!cancelled) setErr(String(e));
      }
    }
    load();
    const t = setInterval(load, 10000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, []);

  const heartbeats = data?.queue?.lastHeartbeats || [];
  const hbByAgent: Record<string, Heartbeat> = {};
  for (const hb of heartbeats) hbByAgent[hb.agent_id] = hb;

  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between">
        <div>
          <h1 className="text-xl font-semibold">Agents</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            6 production agents у LangGraph pipeline. Heartbeats з state DB · refresh кожні 10s.
          </p>
        </div>
        <div className="text-xs text-gray-400">
          {err ? <span className="text-rose-500">offline · {err}</span> : data ? "live" : "loading…"}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {AGENTS.map((a) => {
          const status = deriveStatus(hbByAgent[a.id]);
          return (
            <div
              key={a.id}
              className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-white/5"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-mono uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    {a.id}
                  </div>
                  <h2 className="mt-1 text-lg font-semibold">{a.name}</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{a.role}</p>
                </div>
                <span
                  className={`rounded-full border px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider ${status.color}`}
                >
                  {status.label}
                </span>
              </div>
              <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">{a.description}</p>
              <div className="mt-3 text-[11px] text-gray-400">last seen: {status.lastSeen}</div>
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4 text-sm text-emerald-900 dark:text-emerald-200">
        <strong className="font-medium">Note:</strong> openclaw iframe видалено (2026-05-14).
        Agent runtime тепер локальний — через LangGraph + daemon з SQLite state.
        Status картки оновлюються кожні 10 секунд з `agent_heartbeats` таблиці.
      </div>
    </div>
  );
}
