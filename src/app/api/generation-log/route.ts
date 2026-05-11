import { NextResponse } from "next/server";
import {
  getNotionToken,
  NOTION_API,
  NOTION_GENERATION_LOG_DB,
  NOTION_VERSION,
} from "@/lib/nicom-config";

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
    const data = await res.json();
    const items = (data.results || []).map((page: any) => {
      const p = page.properties || {};
      const t = (prop: any) =>
        (prop?.title?.[0]?.plain_text || prop?.rich_text?.[0]?.plain_text || "").trim();
      return {
        id: page.id,
        title: t(p["Log Name"]),
        sku: t(p["SKU ID"]),
        format: p["Format"]?.select?.name || "",
        model: p["Model"]?.select?.name || "",
        compliance_pass: Boolean(p["Compliance Pass"]?.checkbox),
        human_approved: Boolean(p["Human Approved"]?.checkbox),
        cost_usd: p["Cost USD"]?.number ?? null,
        output_url: p["Output URL"]?.url || "",
        notes: t(p["Notes"]),
        created: page.created_time,
      };
    });
    return NextResponse.json({ items });
  } catch (err: any) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
