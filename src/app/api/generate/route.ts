import { NextRequest } from "next/server";
import { spawn } from "child_process";
import { NICOM_PROJECT_ROOT } from "@/lib/nicom-config";

const VALID_FORMATS = new Set(["ig_stories", "ig_reel", "ig_post", "tiktok", "carousel", "reels_seed"]);
const VALID_MODES = new Set(["platform", "telegram", "auto", "local"]);

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const sku = String(body.sku || "").trim();
  const format = String(body.format || "").trim();
  const mode = String(body.approval_mode || "local").trim();

  if (!sku) return new Response("missing sku", { status: 400 });
  if (!VALID_FORMATS.has(format)) return new Response("invalid format", { status: 400 });
  if (!VALID_MODES.has(mode)) return new Response("invalid approval_mode", { status: 400 });

  const stream = new ReadableStream({
    start(controller) {
      const enc = new TextEncoder();
      const py = spawn(
        "python3",
        ["scripts/run_pipeline.py", "--sku", sku, "--format", format, "--source", "cli"],
        {
          cwd: NICOM_PROJECT_ROOT,
          env: { ...process.env, NICOM_APPROVAL_MODE: mode, PYTHONUNBUFFERED: "1" },
        }
      );

      const push = (kind: string, payload: unknown) =>
        controller.enqueue(enc.encode(`event: ${kind}\ndata: ${JSON.stringify(payload)}\n\n`));

      push("started", { sku, format, mode, pid: py.pid });

      py.stdout.on("data", (chunk) => {
        for (const line of chunk.toString().split("\n")) {
          if (line.trim()) push("stdout", { line });
        }
      });
      py.stderr.on("data", (chunk) => {
        for (const line of chunk.toString().split("\n")) {
          if (line.trim()) push("stderr", { line });
        }
      });
      py.on("close", (code) => {
        push("finished", { code });
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
