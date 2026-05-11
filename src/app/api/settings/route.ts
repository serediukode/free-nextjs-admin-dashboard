import { NextResponse } from "next/server";
import { execSync } from "child_process";
import {
  NICOM_DAEMON_ENV_FILE,
  NICOM_ENV_FILE,
  loadEnvFile,
  NICOM_PROJECT_ROOT,
} from "@/lib/nicom-config";

export const dynamic = "force-dynamic";

const TRACKED_KEYS = [
  "ANTHROPIC_API_KEY",
  "GOOGLE_AI_API_KEY",
  "PLETOR_API_KEY",
  "PLETOR_AGENT_IG_STORIES",
  "PLETOR_AGENT_IG_POST",
  "PLETOR_AGENT_IG_REEL",
  "PLETOR_AGENT_TIKTOK",
  "PLETOR_AGENT_CAROUSEL",
  "PLETOR_AGENT_REELS_SEED",
  "NOTION_TOKEN",
  "TELEGRAM_BOT_TOKEN",
  "TELEGRAM_CHAT_ID",
  "LITELLM_MASTER_KEY",
];

function maskValue(v: string): string {
  if (!v) return "";
  if (v.length <= 8) return "•".repeat(v.length);
  return v.slice(0, 4) + "•".repeat(Math.max(4, v.length - 8)) + v.slice(-4);
}

export async function GET() {
  const projectEnv = loadEnvFile(NICOM_ENV_FILE);
  const daemonEnv = loadEnvFile(NICOM_DAEMON_ENV_FILE);
  const merged: Record<string, string> = { ...daemonEnv, ...projectEnv };

  const keys = TRACKED_KEYS.map((k) => ({
    key: k,
    set_in_project: Boolean(projectEnv[k]),
    set_in_daemon: Boolean(daemonEnv[k]),
    masked: merged[k] ? maskValue(merged[k]) : "",
  }));

  let pletorAgents: number | null = null;
  if (merged.PLETOR_API_KEY) {
    try {
      const res = await fetch("https://api.pletor.ai/api/public/v1/agents/", {
        headers: { "X-Api-Key": merged.PLETOR_API_KEY },
      });
      if (res.ok) {
        const data = await res.json();
        pletorAgents = Array.isArray(data?.data) ? data.data.length : 0;
      }
    } catch {
      pletorAgents = null;
    }
  }

  let launchd: { name: string; loaded: boolean; pid: number | null }[] = [];
  try {
    const out = execSync("launchctl list", { encoding: "utf-8" });
    launchd = ["com.nicom.agent-daemon", "ua.nicom.telegram-bot"].map((label) => {
      const match = out.split("\n").find((l) => l.endsWith(label));
      if (!match) return { name: label, loaded: false, pid: null };
      const cols = match.split(/\s+/);
      const pid = cols[0] === "-" ? null : parseInt(cols[0], 10);
      return { name: label, loaded: true, pid };
    });
  } catch {
    /* noop */
  }

  return NextResponse.json({
    project_root: NICOM_PROJECT_ROOT,
    approval_mode_default: merged.NICOM_APPROVAL_MODE || "platform",
    env: keys,
    pletor_agents: pletorAgents,
    launchd,
  });
}
