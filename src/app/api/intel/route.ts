import { NextRequest, NextResponse } from "next/server";
import Database from "better-sqlite3";
import { NICOM_STATE_DB } from "@/lib/nicom-config";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const kind = req.nextUrl.searchParams.get("kind") || "market";
  try {
    const db = new Database(NICOM_STATE_DB, { readonly: true, fileMustExist: true });
    let rows: any[] = [];
    if (kind === "market") {
      rows = db.prepare("SELECT * FROM market_intel ORDER BY rowid DESC LIMIT 100").all();
    } else if (kind === "competitors_snapshots") {
      rows = db
        .prepare("SELECT * FROM competitor_snapshots ORDER BY rowid DESC LIMIT 60")
        .all();
    } else if (kind === "competitors_diffs") {
      rows = db.prepare("SELECT * FROM competitor_diffs ORDER BY rowid DESC LIMIT 60").all();
    } else if (kind === "alerts") {
      rows = db.prepare("SELECT * FROM alerts_log ORDER BY rowid DESC LIMIT 100").all();
    } else {
      db.close();
      return NextResponse.json({ error: "unknown kind" }, { status: 400 });
    }
    db.close();
    return NextResponse.json({ items: rows });
  } catch (err: any) {
    return NextResponse.json({ error: String(err.message || err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const ids: number[] = Array.isArray(body.ids) ? body.ids : [];
  if (!ids.length) return NextResponse.json({ error: "ids[] required" }, { status: 400 });
  try {
    const db = new Database(NICOM_STATE_DB);
    const stmt = db.prepare("UPDATE alerts_log SET sent=1 WHERE id=?");
    const tx = db.transaction((arr: number[]) => arr.forEach((id) => stmt.run(id)));
    tx(ids);
    db.close();
    return NextResponse.json({ ok: true, count: ids.length });
  } catch (err: any) {
    return NextResponse.json({ error: String(err.message || err) }, { status: 500 });
  }
}
