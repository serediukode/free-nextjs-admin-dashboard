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

    // Fire-and-forget publication dispatch on approval. Don't block the user's
    // Approve click on n8n availability — surface failures via Generation Log.
    let dispatched = false;
    let dispatchError = "";
    if (status === "Approved") {
      const origin = req.nextUrl.origin;
      try {
        const dispatchRes = await fetch(`${origin}/api/publish/dispatch`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ page_id: pageId }),
          signal: AbortSignal.timeout(20000),
        });
        dispatched = dispatchRes.ok;
        if (!dispatched) dispatchError = (await dispatchRes.text()).slice(0, 200);
      } catch (e) {
        dispatchError = e instanceof Error ? e.message : String(e);
      }
    }
    return NextResponse.json({ ok: true, dispatched, dispatchError });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
