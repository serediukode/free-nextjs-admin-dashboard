import { NextResponse } from "next/server";
import Database from "better-sqlite3";
import { NICOM_STATE_DB } from "@/lib/nicom-config";
import { getNotionToken, NOTION_API, NOTION_GENERATION_LOG_DB, NOTION_VERSION } from "@/lib/nicom-config";
import { chk, num, type NotionPage } from "@/lib/notion";

export const dynamic = "force-dynamic";

export async function GET() {
  // 1. SQLite stats
  let queueTotal = 0;
  let queueDone = 0;
  let agentsActive = 0;
  try {
    const db = new Database(NICOM_STATE_DB, { readonly: true, fileMustExist: true });
    const rows = db.prepare("SELECT status, COUNT(*) as n FROM content_queue GROUP BY status").all() as { status: string; n: number }[];
    for (const r of rows) {
      queueTotal += r.n;
      if (r.status === "done") queueDone += r.n;
    }
    const hbRows = db.prepare("SELECT COUNT(*) as n FROM agent_heartbeats WHERE status='running'").all() as { n: number }[];
    agentsActive = hbRows[0]?.n || 0;
    db.close();
  } catch {}

  // 2. Notion generation log stats
  let totalGenerated = 0;
  let compliancePass = 0;
  let humanApproved = 0;
  let weeklyCostUsd = 0;
  try {
    const token = getNotionToken();
    if (token) {
      const res = await fetch(`${NOTION_API}/databases/${NOTION_GENERATION_LOG_DB}/query`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Notion-Version": NOTION_VERSION, "Content-Type": "application/json" },
        body: JSON.stringify({ page_size: 100, sorts: [{ timestamp: "created_time", direction: "descending" }] }),
      });
      if (res.ok) {
        const data = await res.json() as { results?: NotionPage[] };
        const items = data.results || [];
        totalGenerated = items.length;
        compliancePass = items.filter(p => chk(p.properties?.["Compliance Pass"])).length;
        humanApproved = items.filter(p => chk(p.properties?.["Human Approved"])).length;
        // Weekly cost: sum of last 7 days
        const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        for (const p of items) {
          const created = new Date((p as unknown as { created_time: string }).created_time).getTime();
          if (created > weekAgo) {
            const cost = num(p.properties?.["Cost USD"]);
            if (cost) weeklyCostUsd += cost;
          }
        }
      }
    }
  } catch {}

  return NextResponse.json({
    total_generated: totalGenerated,
    compliance_rate: totalGenerated > 0 ? Math.round((compliancePass / totalGenerated) * 100) : null,
    approval_rate: totalGenerated > 0 ? Math.round((humanApproved / totalGenerated) * 100) : null,
    weekly_cost_usd: Math.round(weeklyCostUsd * 100) / 100,
    queue_total: queueTotal,
    queue_done: queueDone,
    agents_active: agentsActive,
  });
}
