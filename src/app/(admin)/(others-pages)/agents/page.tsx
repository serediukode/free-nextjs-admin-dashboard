"use client";

import { useEffect, useState } from "react";
import ScrambleText from "@/components/nicom/ScrambleText";

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
  running: "bg-[var(--color-ok)]/10 text-[var(--color-ok)] border-[var(--color-ok)]/30",
  idle:    "bg-[var(--color-warn)]/10 text-[var(--color-warn)] border-[var(--color-warn)]/30",
  disabled:"bg-[var(--color-nicom-elev)] text-[var(--color-nicom-faint)] border-[var(--color-nicom-border)]",
  unknown: "bg-[var(--color-nicom-elev)] text-[var(--color-nicom-faint)] border-[var(--color-nicom-border)]",
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
          <h1 className="text-xl font-semibold text-[var(--color-nicom-text)]">Agents</h1>
          <p className="mt-1 text-sm text-[var(--color-nicom-muted)]">
            6 production agents у LangGraph pipeline. Heartbeats з state DB · refresh кожні 10s.
          </p>
        </div>
        <div className="nicom-mono text-xs text-[var(--color-nicom-faint)]">
          {err ? <span className="text-[var(--color-danger)]">offline · {err}</span> : data ? "live" : "loading…"}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 onyx-stagger">
        {AGENTS.map((a) => {
          const status = deriveStatus(hbByAgent[a.id]);
          return (
            <div key={a.id} className="nicom-surface p-5 onyx-card-lift">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="nicom-mono text-[var(--color-nicom-faint)]">{a.id}</div>
                  <h2 className="mt-1 text-lg font-semibold text-[var(--color-nicom-text)]"><ScrambleText text={a.name} /></h2>
                  <p className="text-xs text-[var(--color-nicom-faint)]">{a.role}</p>
                </div>
                <span
                  className={`rounded-full border px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider ${status.color}`}
                >
                  {status.label}
                </span>
              </div>
              <p className="mt-3 text-sm text-[var(--color-nicom-muted)]">{a.description}</p>
              <div className="mt-3 nicom-mono text-[11px] text-[var(--color-nicom-faint)]">
                last seen: {status.lastSeen}
              </div>
            </div>
          );
        })}
      </div>

      <div className="nicom-elev border-l-4 border-[var(--color-ok)] p-4 text-sm text-[var(--color-nicom-muted)]">
        <strong className="font-medium text-[var(--color-nicom-text)]">Note:</strong> openclaw iframe видалено (2026-05-14).
        Agent runtime тепер локальний — через LangGraph + daemon з SQLite state.
        Status картки оновлюються кожні 10 секунд з <code className="nicom-mono">agent_heartbeats</code> таблиці.
      </div>
    </div>
  );
}
