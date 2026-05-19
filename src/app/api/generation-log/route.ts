import { NextResponse } from "next/server";
import {
  getNotionToken,
  NOTION_API,
  NOTION_GENERATION_LOG_DB,
  NOTION_VERSION,
} from "@/lib/nicom-config";
import { t, sel, num, chk, url, type NotionPage } from "@/lib/notion";

export const dynamic = "force-dynamic";

export async function GET() {
  const token = getNotionToken();
  if (!token) return NextResponse.json({ error: "NOTION_TOKEN not set" }, { status: 500 });

  try {
    const res = await fetch(`${NOTION_API}/databases/${NOTION_GENERATION_LOG_DB}/query`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Notion-Version": NOTION_VERSION,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        page_size: 30,
        sorts: [{ timestamp: "created_time", direction: "descending" }],
      }),
    });
    if (!res.ok) return NextResponse.json({ error: await res.text() }, { status: res.status });
    const data = (await res.json()) as { results?: NotionPage[] };
    const items = (data.results || []).map((page) => {
      const p = page.properties || {};
      return {
        id: page.id,
        title: t(p["Log Name"]),
        sku: t(p["SKU ID"]),
        format: sel(p["Format"]),
        model: sel(p["Model"]),
        compliance_pass: chk(p["Compliance Pass"]),
        human_approved: chk(p["Human Approved"]),
        cost_usd: num(p["Cost USD"]),
        output_url: url(p["Output URL"]),
        notes: t(p["Notes"]),
        created: (page as unknown as { created_time?: string }).created_time,
      };
    });
    return NextResponse.json({ items });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
