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

  useEffect(() => {
    fetch("/api/settings", { cache: "no-store" })
      .then((r) => r.json())
      .then(setData)
      .catch((e) => setErr(String(e)));
  }, []);

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
          <div className="flex justify-between">
            <dt style={{ color: "var(--color-nicom-faint)" }}>Approval mode default</dt>
            <dd className="nicom-mono" style={{ color: "var(--color-nicom-text)" }}>{data.approval_mode_default}</dd>
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
        <ul className="space-y-2" style={{ fontSize: "13px" }}>
          {data.launchd.map((l) => (
            <li key={l.name} className="flex items-center justify-between">
              <span className="nicom-mono" style={{ color: "var(--color-nicom-text)" }}>{l.name}</span>
              <span style={{ color: "var(--color-nicom-faint)" }}>
                {l.loaded ? (l.pid ? `running (pid ${l.pid})` : "loaded") : "not loaded"}
              </span>
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
