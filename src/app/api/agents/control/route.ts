import { NextRequest, NextResponse } from "next/server";
import { execSync } from "child_process";

const ALLOWED_SERVICES = new Set(["com.nicom.agent-daemon", "ua.nicom.telegram-bot"]);
const ALLOWED_ACTIONS = new Set(["start", "stop", "restart"]);

export async function POST(req: NextRequest) {
  const { service, action } = await req.json().catch(() => ({}));
  if (!service || !ALLOWED_SERVICES.has(service))
    return NextResponse.json({ error: "invalid service" }, { status: 400 });
  if (!action || !ALLOWED_ACTIONS.has(action))
    return NextResponse.json({ error: "invalid action" }, { status: 400 });

  try {
    if (action === "stop") {
      execSync(`launchctl stop ${service}`, { encoding: "utf-8" });
    } else if (action === "start") {
      execSync(`launchctl start ${service}`, { encoding: "utf-8" });
    } else if (action === "restart") {
      try { execSync(`launchctl stop ${service}`, { encoding: "utf-8" }); } catch {}
      await new Promise(r => setTimeout(r, 800));
      execSync(`launchctl start ${service}`, { encoding: "utf-8" });
    }
    return NextResponse.json({ ok: true, service, action });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
