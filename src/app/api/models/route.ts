import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { NICOM_PROJECT_ROOT } from "@/lib/nicom-config";

export const dynamic = "force-dynamic";

const CONFIG_PATH = path.join(NICOM_PROJECT_ROOT, ".model-config.json");

const DEFAULTS: Record<string, string> = {
  prompt_generate: "gemini-2.5-flash",
  caption_generate: "gemini-2.5-flash",
  brief_generate: "claude-sonnet-4-6",
  compliance_check: "llama3.2:3b",
  hashtag_generate: "llama3.2:3b",
  quality_check: "llama3.1:8b",
  caption_rewrite: "mistral:7b",
  research: "deepseek-chat",
  trend_analysis: "deepseek-chat",
  competitor_monitor: "deepseek-chat",
};

const AVAILABLE_MODELS = [
  "llama3.2:3b",
  "llama3.1:8b",
  "mistral:7b",
  "gemini-2.5-flash",
  "gemini-2.0-flash-lite",
  "gemini-2.5-flash-lite",
  "claude-sonnet-4-6",
  "claude-haiku-4-5",
  "deepseek-chat",
  "deepseek-reasoner",
];

export async function GET() {
  const overrides = fs.existsSync(CONFIG_PATH)
    ? JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8"))
    : {};
  const merged: Record<string, string> = { ...DEFAULTS, ...overrides };
  return NextResponse.json({
    config: merged,
    defaults: DEFAULTS,
    overrides,
    available: AVAILABLE_MODELS,
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const task = String(body.task || "").trim();
  const model = String(body.model || "").trim();
  if (!task || !(task in DEFAULTS))
    return NextResponse.json({ error: "invalid task" }, { status: 400 });
  if (!model || !AVAILABLE_MODELS.includes(model))
    return NextResponse.json({ error: "invalid model" }, { status: 400 });

  const overrides = fs.existsSync(CONFIG_PATH)
    ? JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8"))
    : {};
  if (model === DEFAULTS[task]) delete overrides[task];
  else overrides[task] = model;

  fs.writeFileSync(CONFIG_PATH, JSON.stringify(overrides, null, 2) + "\n");
  return NextResponse.json({ ok: true, task, model });
}
