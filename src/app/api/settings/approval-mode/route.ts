import { NextRequest, NextResponse } from "next/server";
import { readFileSync, writeFileSync } from "fs";
import { NICOM_ENV_FILE } from "@/lib/nicom-config";

const VALID = new Set(["local", "auto", "platform", "telegram"]);

export async function POST(req: NextRequest) {
  const { mode } = await req.json().catch(() => ({}));
  if (!mode || !VALID.has(mode))
    return NextResponse.json({ error: "invalid mode" }, { status: 400 });
  try {
    let content = "";
    try { content = readFileSync(NICOM_ENV_FILE, "utf-8"); } catch {}
    if (content.includes("NICOM_APPROVAL_MODE=")) {
      content = content.replace(/NICOM_APPROVAL_MODE=.*/g, `NICOM_APPROVAL_MODE=${mode}`);
    } else {
      content += `\nNICOM_APPROVAL_MODE=${mode}\n`;
    }
    writeFileSync(NICOM_ENV_FILE, content);
    return NextResponse.json({ ok: true, mode });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
