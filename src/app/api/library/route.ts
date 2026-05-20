import { NextRequest } from "next/server";
import fs from "fs";
import path from "path";
import { NICOM_PROJECT_ROOT } from "@/lib/nicom-config";

// Library endpoint — lists all locally generated assets from test-output/ + output/.
// This is the "Library" view that the dashboard shows on the /library page.
// Each entry includes the PNG/JPG path, prompt log (if present), and parsed metadata.

interface LibraryItem {
  filename: string;
  sku: string | null;
  format: string | null;
  source: "test-output" | "output" | "tmp";
  size_kb: number;
  modified_at: string; // ISO
  modified_ts: number; // for sorting
  prompt_log: string | null; // path relative to project root
  url: string; // for <img src> · served via /api/library/file?path=...
}

const IMG_EXT = /\.(png|jpg|jpeg|webp)$/i;

// Parse filename like "20260515-005047_vika-deep-blue_stories.png"
function parseFilename(name: string): { sku: string | null; format: string | null } {
  const m = name.match(/^\d{8}-\d{6}_([a-z0-9-]+?)_([a-z_]+)\.(png|jpg|jpeg|webp)$/i);
  if (m) return { sku: m[1], format: m[2] };
  // Fallback: legacy file naming like "vika-deep-blue_ig_stories_edit.png"
  const m2 = name.match(/^([a-z0-9-]+?)_(ig_stories|ig_post|ig_reel|tiktok|carousel|reels_seed)/i);
  if (m2) return { sku: m2[1], format: m2[2] };
  return { sku: null, format: null };
}

function listDir(absDir: string, source: "test-output" | "output" | "tmp"): LibraryItem[] {
  if (!fs.existsSync(absDir)) return [];
  const out: LibraryItem[] = [];
  for (const name of fs.readdirSync(absDir)) {
    if (!IMG_EXT.test(name)) continue;
    const full = path.join(absDir, name);
    const stat = fs.statSync(full);
    if (!stat.isFile()) continue;
    const { sku, format } = parseFilename(name);
    const base = name.replace(IMG_EXT, "");
    const promptLog = path.join(absDir, `${base}.prompt.txt`);
    const hasPrompt = fs.existsSync(promptLog);
    out.push({
      filename: name,
      sku,
      format,
      source,
      size_kb: Math.round(stat.size / 1024),
      modified_at: stat.mtime.toISOString(),
      modified_ts: stat.mtimeMs,
      prompt_log: hasPrompt ? path.relative(NICOM_PROJECT_ROOT, promptLog) : null,
      url: `/api/library/file?source=${source}&name=${encodeURIComponent(name)}`,
    });
  }
  return out;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sku = searchParams.get("sku");
  const fmt = searchParams.get("format");
  const limit = Number(searchParams.get("limit") || 50);

  // Also scan pipeline default output dir + any NICOM_OUTPUT_DIR override
  const pipelineOutputDir = process.env.NICOM_OUTPUT_DIR || "/tmp/nicom-outputs";
  const all = [
    ...listDir(path.join(NICOM_PROJECT_ROOT, "test-output"), "test-output"),
    ...listDir(path.join(NICOM_PROJECT_ROOT, "output"), "output"),
    ...listDir(pipelineOutputDir, "tmp"),
  ];

  let filtered = all;
  if (sku) filtered = filtered.filter((i) => i.sku === sku);
  if (fmt) filtered = filtered.filter((i) => i.format === fmt);

  filtered.sort((a, b) => b.modified_ts - a.modified_ts);
  filtered = filtered.slice(0, limit);

  return Response.json({
    count: filtered.length,
    total: all.length,
    items: filtered,
  });
}
