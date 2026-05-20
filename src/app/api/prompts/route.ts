import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { NICOM_PROJECT_ROOT } from "@/lib/nicom-config";

export const dynamic = "force-dynamic";

const LIBRARY_PATH = path.join(NICOM_PROJECT_ROOT, "brand-data/prompt-library.json");

function readLibrary(): Record<string, Record<string, string>> {
  try {
    const raw = JSON.parse(fs.readFileSync(LIBRARY_PATH, "utf-8"));
    return raw.sku || raw || {};
  } catch { return {}; }
}

function writeLibrary(data: Record<string, Record<string, string>>) {
  const existing = JSON.parse(fs.readFileSync(LIBRARY_PATH, "utf-8"));
  existing.sku = data;
  fs.writeFileSync(LIBRARY_PATH, JSON.stringify(existing, null, 2) + "\n");
}

// GET ?sku=X&format=Y → single prompt text OR full library
export async function GET(req: NextRequest) {
  const sku = req.nextUrl.searchParams.get("sku");
  const format = req.nextUrl.searchParams.get("format");
  const lib = readLibrary();
  if (sku && format) {
    const text = lib[sku]?.[format] || lib[sku]?.["_default"] || "";
    return NextResponse.json({ sku, format, text });
  }
  if (sku) {
    return NextResponse.json({ sku, prompts: lib[sku] || {} });
  }
  // Return summary: all SKUs with their available formats (no full text for perf)
  const summary: Record<string, string[]> = {};
  for (const [s, formats] of Object.entries(lib)) {
    summary[s] = Object.keys(formats).filter(k => !k.startsWith("_"));
  }
  return NextResponse.json({ skus: Object.keys(lib), summary, library: lib });
}

// PATCH: update or create a prompt
// Body: { sku, format, text }
export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { sku, format, text } = body;
  if (!sku || !format || text === undefined)
    return NextResponse.json({ error: "sku, format, text required" }, { status: 400 });
  const lib = readLibrary();
  if (!lib[sku]) lib[sku] = {};
  lib[sku][format] = text;
  writeLibrary(lib);
  return NextResponse.json({ ok: true, sku, format, chars: text.length });
}

// DELETE: remove a format entry
// Body: { sku, format }
export async function DELETE(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { sku, format } = body;
  if (!sku || !format)
    return NextResponse.json({ error: "sku and format required" }, { status: 400 });
  const lib = readLibrary();
  if (lib[sku]) {
    delete lib[sku][format];
    if (Object.keys(lib[sku]).length === 0) delete lib[sku];
  }
  writeLibrary(lib);
  return NextResponse.json({ ok: true });
}
