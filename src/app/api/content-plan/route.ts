import { NextRequest, NextResponse } from "next/server";
import { getNotionToken, NOTION_API, NOTION_CONTENT_PLAN_DB, NOTION_VERSION } from "@/lib/nicom-config";
import { t, sel, date, type NotionPage } from "@/lib/notion";

// Helper: build Notion properties object from item fields
function buildProps(body: {
  title?: string; sku?: string; channel?: string; brand?: string;
  status?: string; brief?: string; headline?: string; date?: string;
}) {
  const props: Record<string, unknown> = {};
  if (body.title !== undefined)
    props["Post Title"] = { title: [{ text: { content: body.title } }] };
  if (body.sku !== undefined)
    props["SKU"] = { rich_text: [{ text: { content: body.sku } }] };
  if (body.channel !== undefined)
    props["Channel"] = { select: { name: body.channel } };
  if (body.brand !== undefined)
    props["Brand"] = { select: { name: body.brand } };
  if (body.status !== undefined)
    props["Status"] = { select: { name: body.status } };
  if (body.brief !== undefined)
    props["Brief"] = { rich_text: [{ text: { content: body.brief.slice(0, 2000) } }] };
  if (body.headline !== undefined)
    props["Headline UA"] = { rich_text: [{ text: { content: body.headline.slice(0, 2000) } }] };
  if (body.date !== undefined)
    props["Date"] = body.date ? { date: { start: body.date } } : { date: null };
  return props;
}

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

export async function POST(req: NextRequest) {
  const token = getNotionToken();
  if (!token) return NextResponse.json({ error: "NOTION_TOKEN not set" }, { status: 500 });
  const body = await req.json().catch(() => ({}));
  try {
    const res = await fetch(`${NOTION_API}/pages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Notion-Version": NOTION_VERSION, "Content-Type": "application/json" },
      body: JSON.stringify({
        parent: { database_id: NOTION_CONTENT_PLAN_DB },
        properties: buildProps(body),
      }),
    });
    if (!res.ok) return NextResponse.json({ error: await res.text() }, { status: res.status });
    const page = (await res.json()) as NotionPage;
    return NextResponse.json({ id: page.id, ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const token = getNotionToken();
  if (!token) return NextResponse.json({ error: "NOTION_TOKEN not set" }, { status: 500 });
  const body = await req.json().catch(() => ({}));
  const { id, ...fields } = body;
  if (!id) return NextResponse.json({ error: "missing id" }, { status: 400 });
  try {
    const res = await fetch(`${NOTION_API}/pages/${id}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}`, "Notion-Version": NOTION_VERSION, "Content-Type": "application/json" },
      body: JSON.stringify({ properties: buildProps(fields) }),
    });
    if (!res.ok) return NextResponse.json({ error: await res.text() }, { status: res.status });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
