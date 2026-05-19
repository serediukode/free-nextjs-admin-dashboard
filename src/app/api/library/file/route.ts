import { NextRequest } from "next/server";
import fs from "fs";
import path from "path";
import { NICOM_PROJECT_ROOT } from "@/lib/nicom-config";

// Serves a single image file from test-output/ or output/.
// Returns the raw image bytes with proper Content-Type.
// Validates: filename is basename only (no traversal), source is allowed.

const ALLOWED_SOURCES = new Set(["test-output", "output"]);
const MIME = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
} as const;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const source = searchParams.get("source") || "test-output";
  const name = searchParams.get("name") || "";

  if (!ALLOWED_SOURCES.has(source)) {
    return new Response("invalid source", { status: 400 });
  }
  if (!name || name.includes("/") || name.includes("..") || name.includes("\\")) {
    return new Response("invalid name", { status: 400 });
  }

  const filePath = path.join(NICOM_PROJECT_ROOT, source, name);
  if (!fs.existsSync(filePath)) {
    return new Response("not found", { status: 404 });
  }

  const ext = path.extname(name).slice(1).toLowerCase() as keyof typeof MIME;
  const mime = MIME[ext] || "application/octet-stream";

  const data = fs.readFileSync(filePath);
  return new Response(data, {
    headers: {
      "Content-Type": mime,
      "Cache-Control": "public, max-age=300",
    },
  });
}
