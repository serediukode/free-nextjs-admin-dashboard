import { NextRequest, NextResponse } from "next/server";
import { getNotionToken, NOTION_API, NOTION_VERSION } from "@/lib/nicom-config";

export async function POST(req: NextRequest) {
  const token = getNotionToken();
  if (!token) return NextResponse.json({ error: "NOTION_TOKEN not set" }, { status: 500 });

  const body = await req.json().catch(() => ({}));
  const pageId = String(body.page_id || "").trim();
  const status = String(body.status || "").trim();
  if (!pageId || !status) return NextResponse.json({ error: "page_id and status required" }, { status: 400 });

  try {
    const res = await fetch(`${NOTION_API}/pages/${pageId}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Notion-Version": NOTION_VERSION,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ properties: { Status: { select: { name: status } } } }),
    });
    if (!res.ok) return NextResponse.json({ error: await res.text() }, { status: res.status });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
