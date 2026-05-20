"use client";

import { useEffect, useState } from "react";

type Service = { name: string; pid: number | null; alive: boolean; lastExit: number | null };
type Heartbeat = { agent_id: string; ts: string; status: string };

type StatusPayload = {
  services: Service[];
  n8n: { pid: number | null; alive: boolean };
  queue:
    | { counts: Record<string, number>; unsentAlerts: number; lastHeartbeats: Heartbeat[] }
    | { error: string };
  now: string;
};

function Surface({
  num,
  title,
  hint,
  children,
  accent,
}: {
  num: string;
  title: string;
  hint?: string;
  children: React.ReactNode;
  accent?: "ok" | "warn" | "danger" | "accent";
}) {
  const borderClass =
    accent === "ok"
      ? "nicom-status-ok"
      : accent === "warn"
        ? "nicom-status-warn"
        : accent === "danger"
          ? "nicom-status-danger"
          : accent === "accent"
            ? "nicom-status-accent"
            : "";
  return (
    <section className={`onyx-panel ${borderClass}`}>
      <header className="mb-4 flex items-baseline gap-3 pb-3" style={{ borderBottom: "0.5px solid var(--color-nicom-border)" }}>
        <span className="nicom-section-num">{num}</span>
        <h3 className="onyx-h3 mb-0">{title}</h3>
        {hint && <span className="onyx-pill ml-auto" style={{ fontSize: "9px" }}>{hint}</span>}
      </header>
      {children}
    </section>
  );
}

function Dot({ ok }: { ok: boolean }) {
  return (
    <span
      className="inline-block size-2 rounded-full"
      style={{ background: ok ? "var(--color-ok)" : "var(--color-danger)" }}
    />
  );
}

function fmtAgo(iso?: string): string {
  if (!iso) return "—";
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "—";
  const diff = Date.now() - t;
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

type KpiData = {
  total_generated: number;
  compliance_rate: number | null;
  approval_rate: number | null;
  weekly_cost_usd: number;
  agents_active: number;
};

function KpiTiles() {
  const [kpi, setKpi] = useState<KpiData | null>(null);
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/kpi", { cache: "no-store" });
        if (res.ok) setKpi(await res.json());
      } catch {}
    }
    load();
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, []);

  const tiles = [
    { label: "Total generated", value: kpi?.total_generated ?? "—", accent: "ok" },
    { label: "Compliance rate", value: kpi?.compliance_rate != null ? `${kpi.compliance_rate}%` : "—", accent: "ok" },
    { label: "Approval rate",   value: kpi?.approval_rate  != null ? `${kpi.approval_rate}%`  : "—", accent: "vika" },
    { label: "Weekly cost",     value: kpi?.weekly_cost_usd != null ? `$${kpi.weekly_cost_usd.toFixed(2)}` : "—", accent: "pablo" },
  ];

  const accentColors: Record<string, string> = { ok: "var(--color-ok)", vika: "var(--color-vika)", pablo: "var(--color-pablo)", sbr: "var(--color-sbr)" };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "1px", background: "var(--color-nicom-border-strong)", borderRadius: "8px", overflow: "hidden", marginBottom: "4px" }}>
      {tiles.map((t) => (
        <div key={t.label} style={{ background: "var(--color-nicom-bg)", padding: "20px 22px", borderLeft: `2px solid ${accentColors[t.accent]}` }}>
          <div className="onyx-eyebrow" style={{ marginBottom: "8px" }}>{t.label}</div>
          <div style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: "36px", color: "var(--color-nicom-text)", lineHeight: 1, letterSpacing: "-1px" }}>{t.value}</div>
        </div>
      ))}
    </div>
  );
}

export default function LiveStatus() {
  const [data, setData] = useState<StatusPayload | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function tick() {
      try {
        const res = await fetch("/api/status", { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (!cancelled) {
          setData(json);
          setErr(null);
        }
      } catch (e) {
        if (!cancelled) setErr(String(e));
      }
    }
    tick();
    const id = setInterval(tick, 5000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  if (err) return <div className="text-[var(--color-danger)]">Error: {err}</div>;
  if (!data) return <div className="text-[var(--color-nicom-faint)]">Loading…</div>;

  const queue = "error" in data.queue ? null : data.queue;

  return (
    <div className="space-y-6 onyx-page">
      {/* Page header */}
      <div className="mb-8">
        <p className="onyx-eyebrow mb-2">Control Center · Live</p>
        <h1 style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: "32px", letterSpacing: "-0.3px", color: "var(--color-nicom-text)", marginBottom: "8px" }}>
          Factory Status
        </h1>
        <p style={{ color: "var(--color-nicom-muted)", fontSize: "13px" }}>
          Nicom AI SMM Factory · LangGraph 6-agent pipeline · 4 brands · 10 SKU
        </p>
      </div>

      {/* KPI tiles */}
      <KpiTiles />

      <div className="grid grid-cols-12 gap-4 onyx-stagger">
        <div className="col-span-12 md:col-span-6">
          <Surface num="01" title="Services" accent="ok" hint={`${data.services.filter((s) => s.alive).length}/${data.services.length} alive`}>
            <ul className="space-y-3">
              {data.services.map((s) => (
                <li
                  key={s.name}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="flex items-center gap-2">
                    <Dot ok={s.alive} />
                    <span className="nicom-mono text-[var(--color-nicom-text)]">{s.name}</span>
                  </span>
                  <span className="nicom-mono text-[var(--color-nicom-faint)]">
                    {s.alive ? `pid ${s.pid}` : `exit ${s.lastExit ?? "—"}`}
                  </span>
                </li>
              ))}
              <li className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Dot ok={data.n8n.alive} />
                  <span className="nicom-mono text-[var(--color-nicom-text)]">n8n</span>
                </span>
                <span className="nicom-mono text-[var(--color-nicom-faint)]">
                  {data.n8n.alive ? `pid ${data.n8n.pid}` : "down"}
                </span>
              </li>
            </ul>
          </Surface>
        </div>

        <div className="col-span-12 md:col-span-6">
          <Surface num="02" title="Content Queue" accent="accent" hint="SQLite">
            {queue ? (
              <>
                <div className="grid grid-cols-3 gap-3">
                  {(["pending", "processing", "done"] as const).map((k) => (
                    <div key={k} className="nicom-elev p-3 text-center">
                      <div className="font-mono text-2xl font-bold text-[var(--color-nicom-text)]">
                        {queue.counts[k] ?? 0}
                      </div>
                      <div className="mt-1 text-[10px] uppercase tracking-wider text-[var(--color-nicom-faint)]">
                        {k}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex items-center justify-between text-sm">
                  <span className="text-[var(--color-nicom-muted)]">Unsent alerts</span>
                  <span
                    className="nicom-mono font-semibold"
                    style={{ color: queue.unsentAlerts > 0 ? "var(--color-warn)" : "var(--color-ok)" }}
                  >
                    {queue.unsentAlerts}
                  </span>
                </div>
              </>
            ) : (
              <div className="text-sm text-[var(--color-nicom-faint)]">
                state.db not initialised — daemon will create on first run
              </div>
            )}
          </Surface>
        </div>

        <div className="col-span-12">
          <Surface
            num="03"
            title="Agent Heartbeats"
            accent="warn"
            hint={`${queue?.lastHeartbeats?.length || 0} agents`}
          >
            {queue && queue.lastHeartbeats?.length ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-wider text-[var(--color-nicom-faint)]">
                    <th className="pb-2 font-medium">Agent</th>
                    <th className="pb-2 font-medium">Status</th>
                    <th className="pb-2 font-medium">Last heartbeat</th>
                    <th className="pb-2 font-medium text-right">Age</th>
                  </tr>
                </thead>
                <tbody>
                  {queue.lastHeartbeats.map((h) => (
                    <tr
                      key={h.agent_id}
                      className="border-t border-[var(--color-nicom-hairline)]"
                    >
                      <td className="py-2.5 nicom-mono text-[var(--color-nicom-text)]">
                        {h.agent_id}
                      </td>
                      <td className="py-2.5">
                        <span className="nicom-chip nicom-chip-ok">{h.status}</span>
                      </td>
                      <td className="py-2.5 nicom-mono text-[10px] text-[var(--color-nicom-faint)]">
                        {h.ts}
                      </td>
                      <td className="py-2.5 nicom-mono text-right text-[var(--color-nicom-muted)]">
                        {fmtAgo(h.ts)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-sm text-[var(--color-nicom-faint)]">
                No heartbeats yet — start daemon to populate.
              </div>
            )}
          </Surface>
        </div>
      </div>
    </div>
  );
}
