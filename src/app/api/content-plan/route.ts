import { NextRequest, NextResponse } from "next/server";
import { getNotionToken, NOTION_API, NOTION_CONTENT_PLAN_DB, NOTION_VERSION } from "@/lib/nicom-config";
import { t, sel, date, type NotionPage } from "@/lib/notion";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const token = getNotionToken();
  if (!token) return NextResponse.json({ error: "NOTION_TOKEN not set" }, { status: 500 });

  const status = req.nextUrl.searchParams.get("status");
  const filter = status
    ? { property: "Status", select: { equals: status } }
    : undefined;

  try {
    const res = await fetch(`${NOTION_API}/databases/${NOTION_CONTENT_PLAN_DB}/query`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Notion-Version": NOTION_VERSION,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ filter, page_size: 50 }),
    });
    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: text }, { status: res.status });
    }
    const data = (await res.json()) as { results?: NotionPage[] };
    const items = (data.results || []).map((page) => {
      const p = page.properties || {};
      return {
        id: page.id,
        title: t(p["Post Title"]) || t(p["Name"]),
        sku: t(p["SKU"]),
        channel: sel(p["Channel"]),
        brand: sel(p["Brand"]),
        status: sel(p["Status"]),
        brief: t(p["Brief"]),
        headline: t(p["Headline UA"]),
        date: date(p["Date"]),
        last_edited: (page as unknown as { last_edited_time?: string }).last_edited_time,
      };
    });
    return NextResponse.json({ items });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
