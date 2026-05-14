export const metadata = {
  title: "Nicom — Agents",
};

type Agent = {
  id: string;
  name: string;
  role: string;
  status: "running" | "idle" | "disabled";
  lastSeen?: string;
  description: string;
};

const AGENTS: Agent[] = [
  {
    id: "niko",
    name: "Niko",
    role: "Brand persona · content voice",
    status: "running",
    lastSeen: "active",
    description:
      "Бренд-голос для VIKA / SBR / Pablo. Працює через daemon `pipeline/agents/orchestrator.py` + LLM router (Claude Haiku для brief, Llama 3.1 для caption).",
  },
  {
    id: "research",
    name: "Research",
    role: "Market intelligence",
    status: "running",
    lastSeen: "active",
    description:
      "Daemon `pipeline/agents/market_intelligence.py` · читає competitor snapshots + reads з DeepSeek API · пише у state DB `market_intel`.",
  },
  {
    id: "compliance",
    name: "Compliance",
    role: "7-rule brand policy gate",
    status: "running",
    lastSeen: "active",
    description:
      "Pre-publish gate · 7 правил (legacy wordmark · heritage 1879 · 21+ · legal · manufacturer · open-pouch · channel-policy) · виконується через `pipeline/langgraph/compliance_gate.py`.",
  },
  {
    id: "competitor-monitor",
    name: "Competitor Monitor",
    role: "Daily competitor scrape",
    status: "running",
    description:
      "`pipeline/agents/competitor_monitor.py` + Firecrawl · denoise → diff → alert. Daily cron.",
  },
  {
    id: "product-agent",
    name: "Product Agent",
    role: "Per-SKU brief + headline composer",
    status: "running",
    description:
      "`pipeline/agents/product_agent.py` · читає `brand-data/products.json` + Content Plan · готує context-rich brief для Pletor.",
  },
  {
    id: "telegram-bot",
    name: "Telegram Bot",
    role: "Approval gate · operator notifications",
    status: "running",
    description:
      "`pipeline/telegram-bot/bot.py` + launchd · approve/reject inline у Telegram · sync статусу назад у state DB.",
  },
];

const statusBadge = {
  running: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  idle: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
  disabled: "bg-gray-500/10 text-gray-500 border-gray-500/30",
};

export default function AgentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Agents</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          6 production agents у LangGraph pipeline + daemon. Status pull з state DB кожні 30s.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {AGENTS.map((a) => (
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
                className={`rounded-full border px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider ${
                  statusBadge[a.status]
                }`}
              >
                {a.status}
              </span>
            </div>
            <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">{a.description}</p>
            {a.lastSeen && (
              <div className="mt-3 text-[11px] text-gray-400">last seen: {a.lastSeen}</div>
            )}
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-amber-900 dark:text-amber-200">
        <strong className="font-medium">Note:</strong> openclaw iframe видалено (2026-05-14).
        Agent runtime тепер локальний — через LangGraph + daemon з SQLite state.
        Залогуватись у Telegram bot для approval-flow.
      </div>
    </div>
  );
}
