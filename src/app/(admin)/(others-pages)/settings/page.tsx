"use client";

import { useEffect, useState } from "react";

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

  if (err) return <div className="text-rose-500">Error: {err}</div>;
  if (!data) return <div>Loading…</div>;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Project</h3>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-gray-500">Root</dt>
            <dd className="font-mono">{data.project_root}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">Approval mode default</dt>
            <dd className="font-mono">{data.approval_mode_default}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">Pletor agents</dt>
            <dd className="font-mono">
              {data.pletor_agents === null ? "n/a" : `${data.pletor_agents}/6`}
            </dd>
          </div>
        </dl>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
          Launchd services
        </h3>
        <ul className="space-y-2 text-sm">
          {data.launchd.map((l) => (
            <li key={l.name} className="flex items-center justify-between">
              <span className="font-mono">{l.name}</span>
              <span className="text-gray-500">
                {l.loaded ? (l.pid ? `running (pid ${l.pid})` : "loaded") : "not loaded"}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
          Environment keys
        </h3>
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="pb-2">Key</th>
              <th className="pb-2">Project .env</th>
              <th className="pb-2">Daemon .env</th>
              <th className="pb-2 text-right">Masked</th>
            </tr>
          </thead>
          <tbody>
            {data.env.map((e) => (
              <tr key={e.key} className="border-t border-gray-100 dark:border-gray-800">
                <td className="py-2 font-mono">{e.key}</td>
                <td className="py-2">{e.set_in_project ? "✓" : "—"}</td>
                <td className="py-2">{e.set_in_daemon ? "✓" : "—"}</td>
                <td className="py-2 text-right font-mono text-xs">{e.masked || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
