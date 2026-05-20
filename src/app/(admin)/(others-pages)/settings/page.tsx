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

  if (err) return <div className="text-[var(--color-danger)]">Error: {err}</div>;
  if (!data) return <div className="text-[var(--color-nicom-faint)]">Loading…</div>;

  return (
    <div className="space-y-6">
      <ModelSwitcher />

      <section className="nicom-surface p-5">
        <h3 className="nicom-h4 mb-3">Project</h3>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-[var(--color-nicom-faint)]">Root</dt>
            <dd className="nicom-mono text-[var(--color-nicom-text)]">{data.project_root}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-[var(--color-nicom-faint)]">Approval mode default</dt>
            <dd className="nicom-mono text-[var(--color-nicom-text)]">{data.approval_mode_default}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-[var(--color-nicom-faint)]">Pletor agents</dt>
            <dd className="nicom-mono text-[var(--color-nicom-text)]">
              {data.pletor_agents === null ? "n/a" : `${data.pletor_agents}/6`}
            </dd>
          </div>
        </dl>
      </section>

      <section className="nicom-surface p-5">
        <h3 className="nicom-h4 mb-3">Launchd services</h3>
        <ul className="space-y-2 text-sm">
          {data.launchd.map((l) => (
            <li key={l.name} className="flex items-center justify-between">
              <span className="nicom-mono text-[var(--color-nicom-text)]">{l.name}</span>
              <span className="text-[var(--color-nicom-faint)]">
                {l.loaded ? (l.pid ? `running (pid ${l.pid})` : "loaded") : "not loaded"}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="nicom-surface p-5">
        <h3 className="nicom-h4 mb-3">Environment keys</h3>
        <table className="w-full text-sm">
          <thead className="text-left text-[10px] uppercase tracking-wider text-[var(--color-nicom-faint)]">
            <tr>
              <th className="pb-2 font-medium">Key</th>
              <th className="pb-2 font-medium">Project .env</th>
              <th className="pb-2 font-medium">Daemon .env</th>
              <th className="pb-2 font-medium text-right">Masked</th>
            </tr>
          </thead>
          <tbody>
            {data.env.map((e) => (
              <tr key={e.key} className="border-t border-[var(--color-nicom-hairline)]">
                <td className="py-2 nicom-mono text-[var(--color-nicom-text)]">{e.key}</td>
                <td className="py-2 text-[var(--color-nicom-muted)]">{e.set_in_project ? "✓" : "—"}</td>
                <td className="py-2 text-[var(--color-nicom-muted)]">{e.set_in_daemon ? "✓" : "—"}</td>
                <td className="py-2 text-right nicom-mono text-xs text-[var(--color-nicom-faint)]">{e.masked || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
