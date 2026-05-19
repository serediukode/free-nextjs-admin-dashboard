import { NextResponse } from "next/server";
import { execSync } from "child_process";
import Database from "better-sqlite3";
import { NICOM_STATE_DB } from "@/lib/nicom-config";

export const dynamic = "force-dynamic";

type ServiceStatus = { name: string; pid: number | null; alive: boolean; lastExit: number | null };

function launchdStatus(): ServiceStatus[] {
  try {
    const out = execSync("launchctl list", { encoding: "utf-8" });
    const services: ServiceStatus[] = [];
    for (const line of out.split("\n")) {
      const m = line.match(/^(-|\d+)\s+(-|\d+)\s+(com\.nicom\.\S+|ua\.nicom\.\S+)$/);
      if (!m) continue;
      const pid = m[1] === "-" ? null : parseInt(m[1], 10);
      const lastExit = m[2] === "-" ? null : parseInt(m[2], 10);
      services.push({ name: m[3], pid, alive: pid !== null, lastExit });
    }
    return services;
  } catch {
    return [];
  }
}

function n8nProcess(): { pid: number | null; alive: boolean } {
  try {
    const out = execSync("pgrep -f 'n8n start'", { encoding: "utf-8" }).trim();
    if (!out) return { pid: null, alive: false };
    return { pid: parseInt(out.split("\n")[0], 10), alive: true };
  } catch {
    return { pid: null, alive: false };
  }
}

function queueStats() {
  // Graceful empty-shape when the daemon hasn't created state.db yet —
  // dashboard renders blank tiles instead of error.
  const empty = { counts: {} as Record<string, number>, unsentAlerts: 0, lastHeartbeats: [] };
  try {
    const db = new Database(NICOM_STATE_DB, { readonly: true, fileMustExist: true });
    const counts: Record<string, number> = {};
    for (const row of db
      .prepare("SELECT status, COUNT(*) as n FROM content_queue GROUP BY status")
      .all() as { status: string; n: number }[]) {
      counts[row.status] = row.n;
    }
    const unsentAlerts = (
      db.prepare("SELECT COUNT(*) as n FROM alerts_log WHERE sent=0").get() as { n: number }
    ).n;
    const lastHeartbeats = db
      .prepare(
        "SELECT agent_id, last_ping as ts, status FROM agent_heartbeats ORDER BY last_ping DESC"
      )
      .all();
    db.close();
    return { counts, unsentAlerts, lastHeartbeats };
  } catch (err) {
    const msg = String(err);
    // Missing DB / missing tables → return empty shape (not an error condition)
    if (msg.includes("unable to open database") || msg.includes("no such table")) {
      return empty;
    }
    return { ...empty, error: msg };
  }
}

export async function GET() {
  return NextResponse.json({
    services: launchdStatus(),
    n8n: n8nProcess(),
    queue: queueStats(),
    now: new Date().toISOString(),
  });
}
