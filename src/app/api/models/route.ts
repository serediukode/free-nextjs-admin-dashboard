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

// Kept in sync with pipeline/models/router.py model sets.
const AVAILABLE_MODELS = [
  // Ollama local
  "llama3.2:3b",
  "llama3.1:8b",
  "mistral:7b",
  "qwen3:8b",
  "gemma2:9b",
  // Google Gemini
  "gemini-2.5-flash",
  "gemini-2.0-flash-lite",
  "gemini-2.5-flash-lite",
  // Anthropic Claude
  "claude-opus-4-7",
  "claude-sonnet-4-6",
  "claude-haiku-4-5",
  // DeepSeek
  "deepseek-chat",
  "deepseek-reasoner",
  // Moonshot Kimi
  "kimi-k2.6",
  "kimi-k2.5",
  "kimi-k2-turbo",
];

export async function GET() {
  let raw: Record<string, unknown> = {};
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      raw = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8"));
    }
  } catch {
    raw = {}; // corrupted file — start fresh
  }
  // .model-config.json may carry non-string keys like `_rationale` (object).
  // Strip them so `config` stays Record<string,string> for the UI dropdowns.
  const overrides: Record<string, string> = Object.fromEntries(
    Object.entries(raw).filter(([, v]) => typeof v === "string")
  ) as Record<string, string>;
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
