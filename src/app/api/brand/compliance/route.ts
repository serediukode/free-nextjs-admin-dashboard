import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { NICOM_PROJECT_ROOT } from "@/lib/nicom-config";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const file = path.join(NICOM_PROJECT_ROOT, "brand-data", "compliance-rules.json");
    if (!fs.existsSync(file))
      return NextResponse.json({ error: `not found: ${file}` }, { status: 404 });
    const data = JSON.parse(fs.readFileSync(file, "utf-8"));
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: String(err.message || err) }, { status: 500 });
  }
}
