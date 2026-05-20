import { NextRequest } from "next/server";
import fs from "fs";
import path from "path";
import { NICOM_PROJECT_ROOT } from "@/lib/nicom-config";

const MIME = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
} as const;

function resolveDir(source: string): string {
  if (source === "test-output") return path.join(NICOM_PROJECT_ROOT, "test-output");
  if (source === "output") return path.join(NICOM_PROJECT_ROOT, "output");
  if (source === "tmp") return process.env.NICOM_OUTPUT_DIR || "/tmp/nicom-outputs";
  return "";
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const source = searchParams.get("source") || "test-output";
  const name = searchParams.get("name") || "";

  const dir = resolveDir(source);
  if (!dir) return new Response("invalid source", { status: 400 });

  if (!name || name.includes("/") || name.includes("..") || name.includes("\\")) {
    return new Response("invalid name", { status: 400 });
  }

  const filePath = path.join(dir, name);
  if (!fs.existsSync(filePath)) {
    return new Response("not found", { status: 404 });
  }

  const ext = path.extname(name).slice(1).toLowerCase() as keyof typeof MIME;
  const mime = MIME[ext] || "application/octet-stream";

  const data = fs.readFileSync(filePath);
  return new Response(data, {
    headers: {
      "Content-Type": mime,
      "Cache-Control": "public, max-age=60",
    },
  });
}
