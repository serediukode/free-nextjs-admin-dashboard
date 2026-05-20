"use client";

import { useEffect, useState } from "react";
import ModelSwitcher from "@/components/nicom/ModelSwitcher";

type EnvKey = {
  key: string;
  set_in_project: boolean;
  set_in_daemon: boolean;
  masked: string;
};

type Settings = {
  project_root: string;
  approval_mode_default: string;
  env: EnvKey[];
  pletor_agents: number | null;
  launchd: { name: string; loaded: boolean; pid: number | null }[];
};

export default function SettingsPage() {
  const [data, setData] = useState<Settings | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [servicesBusy, setServicesBusy] = useState<string | null>(null);
  const [approvalMode, setApprovalMode] = useState<string>("");

  useEffect(() => {
    fetch("/api/settings", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setApprovalMode(d.approval_mode_default);
      })
      .catch((e) => setErr(String(e)));
  }, []);

  async function controlLaunchd(name: string, action: "start" | "stop" | "restart") {
    setServicesBusy(`${name}-${action}`);
    try {
      const res = await fetch("/api/agents/control", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ service: name, action }),
      });
      if (!res.ok) throw new Error(await res.text());
      // refresh settings
      const r2 = await fetch("/api/settings", { cache: "no-store" });
      setData(await r2.json());
    } catch (e) { setErr(String(e)); }
    finally { setServicesBusy(null); }
  }

  async function saveApprovalMode(mode: string) {
    setApprovalMode(mode);
    try {
      await fetch("/api/settings/approval-mode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode }),
      });
    } catch {}
  }

  if (err) return <div style={{ color: "var(--color-danger)" }}>Error: {err}</div>;
  if (!data) return <div style={{ color: "var(--color-nicom-faint)" }}>Loading…</div>;

  return (
    <div className="space-y-6">
      <ModelSwitcher />

      <section className="onyx-panel">
        <p className="onyx-eyebrow mb-4">Project</p>
        <dl className="space-y-2" style={{ fontSize: "13px" }}>
          <div className="flex justify-between">
            <dt style={{ color: "var(--color-nicom-faint)" }}>Root</dt>
            <dd className="nicom-mono" style={{ color: "var(--color-nicom-text)" }}>{data.project_root}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt style={{ color: "var(--color-nicom-faint)" }}>Approval mode</dt>
            <dd>
              <select
                value={approvalMode}
                onChange={(e) => saveApprovalMode(e.target.value)}
                className="onyx-select"
                style={{ width: "140px" }}
              >
                {["local", "auto", "platform", "telegram"].map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </dd>
          </div>
          <div className="flex justify-between">
            <dt style={{ color: "var(--color-nicom-faint)" }}>Pletor agents</dt>
            <dd className="nicom-mono" style={{ color: "var(--color-nicom-text)" }}>
              {data.pletor_agents === null ? "n/a" : `${data.pletor_agents}/6`}
            </dd>
          </div>
        </dl>
      </section>

      <section className="onyx-panel">
        <p className="onyx-eyebrow mb-4">Launchd services</p>
        <ul className="space-y-3" style={{ fontSize: "13px" }}>
          {data.launchd.map((l) => (
            <li key={l.name} className="flex items-center justify-between gap-3">
              <div>
                <span className="nicom-mono" style={{ color: "var(--color-nicom-text)" }}>{l.name}</span>
                <div className="nicom-mono text-[10px] mt-0.5" style={{ color: l.loaded && l.pid ? "var(--color-ok)" : "var(--color-nicom-faint)" }}>
                  {l.loaded ? (l.pid ? `● running · pid ${l.pid}` : "loaded · no pid") : "○ not loaded"}
                </div>
              </div>
              <div style={{ display: "flex", gap: "6px" }}>
                <button
                  disabled={!!servicesBusy}
                  onClick={() => controlLaunchd(l.name, "restart")}
                  className="btn-onyx-ghost"
                  style={{ padding: "4px 10px", fontSize: "9px" }}
                >
                  {servicesBusy === `${l.name}-restart` ? "…" : "↻"}
                </button>
                <button
                  disabled={!!servicesBusy}
                  onClick={() => controlLaunchd(l.name, "stop")}
                  className="btn-onyx-danger"
                  style={{ padding: "4px 10px", fontSize: "9px" }}
                >
                  {servicesBusy === `${l.name}-stop` ? "…" : "Stop"}
                </button>
                <button
                  disabled={!!servicesBusy}
                  onClick={() => controlLaunchd(l.name, "start")}
                  className="btn-onyx-success"
                  style={{ padding: "4px 10px", fontSize: "9px" }}
                >
                  {servicesBusy === `${l.name}-start` ? "…" : "Start"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="onyx-panel overflow-hidden" style={{ padding: 0 }}>
        <div style={{ padding: "22px 24px 12px" }}>
          <p className="onyx-eyebrow mb-0">Environment keys</p>
        </div>
        <table className="onyx-table">
          <thead>
            <tr>
              <th>Key</th>
              <th>Project .env</th>
              <th>Daemon .env</th>
              <th style={{ textAlign: "right" }}>Masked</th>
            </tr>
          </thead>
          <tbody>
            {data.env.map((e) => (
              <tr key={e.key}>
                <td className="mono-cell" style={{ color: "var(--color-nicom-text)" }}>{e.key}</td>
                <td>{e.set_in_project ? "✓" : "—"}</td>
                <td>{e.set_in_daemon ? "✓" : "—"}</td>
                <td className="mono-cell" style={{ textAlign: "right", fontSize: "11px" }}>{e.masked || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
