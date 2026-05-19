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

function Card({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {title}
      </h3>
      {children}
    </div>
  );
}

function Dot({ ok }: { ok: boolean }) {
  return (
    <span
      className={`inline-block size-2.5 rounded-full ${
        ok ? "bg-emerald-500" : "bg-rose-500"
      }`}
    />
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

  if (err) return <div className="text-rose-500">Error: {err}</div>;
  if (!data) return <div>Loading…</div>;

  const queue = "error" in data.queue ? null : data.queue;

  return (
    <div className="grid grid-cols-12 gap-4 md:gap-6">
      <div className="col-span-12 md:col-span-6">
        <Card title="Services">
          <ul className="space-y-3">
            {data.services.map((s) => (
              <li key={s.name} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Dot ok={s.alive} />
                  <span className="font-mono">{s.name}</span>
                </span>
                <span className="text-gray-500">
                  {s.alive ? `PID ${s.pid}` : `exit ${s.lastExit ?? "—"}`}
                </span>
              </li>
            ))}
            <li className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <Dot ok={data.n8n.alive} />
                <span className="font-mono">n8n</span>
              </span>
              <span className="text-gray-500">
                {data.n8n.alive ? `PID ${data.n8n.pid}` : "down"}
              </span>
            </li>
          </ul>
        </Card>
      </div>

      <div className="col-span-12 md:col-span-6">
        <Card title="Content Queue (SQLite)">
          {queue ? (
            <>
              <div className="grid grid-cols-3 gap-3">
                {(["pending", "processing", "done"] as const).map((k) => (
                  <div
                    key={k}
                    className="rounded-lg bg-gray-50 p-3 text-center dark:bg-gray-800"
                  >
                    <div className="text-2xl font-bold">{queue.counts[k] ?? 0}</div>
                    <div className="text-xs uppercase tracking-wide text-gray-500">{k}</div>
                  </div>
                ))}
              </div>
              <div className="mt-4 text-sm">
                Unsent alerts:{" "}
                <span className="font-semibold text-amber-600">{queue.unsentAlerts}</span>
              </div>
            </>
          ) : (
            <div className="text-sm text-rose-500">{(data.queue as { error: string }).error}</div>
          )}
        </Card>
      </div>

      <div className="col-span-12">
        <Card title="Agent Heartbeats">
          {queue && queue.lastHeartbeats?.length ? (
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="pb-2">Agent</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2">Last heartbeat</th>
                </tr>
              </thead>
              <tbody>
                {queue.lastHeartbeats.map((h) => (
                  <tr key={h.agent_id} className="border-t border-gray-100 dark:border-gray-800">
                    <td className="py-2 font-mono">{h.agent_id}</td>
                    <td className="py-2">
                      <span className="rounded bg-gray-100 px-2 py-0.5 text-xs dark:bg-gray-800">
                        {h.status}
                      </span>
                    </td>
                    <td className="py-2 text-gray-500">{h.ts}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-sm text-gray-500">No heartbeats yet.</div>
          )}
        </Card>
      </div>

      <div className="col-span-12 text-right text-xs text-gray-400">
        Updated {new Date(data.now).toLocaleTimeString()}
      </div>
    </div>
  );
}
