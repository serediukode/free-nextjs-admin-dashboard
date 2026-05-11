import { getNotionToken, NOTION_API, NOTION_VERSION } from "@/lib/nicom-config";

export type NotionPage = { id: string; properties: Record<string, any>; [k: string]: any };

export async function queryNotionDB(dbId: string, body: Record<string, any> = {}) {
  const token = getNotionToken();
  if (!token) throw new Error("NOTION_TOKEN not set");
  const res = await fetch(`${NOTION_API}/databases/${dbId}/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Notion-Version": NOTION_VERSION,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ page_size: 100, ...body }),
  });
  if (!res.ok) throw new Error(`Notion ${res.status}: ${await res.text()}`);
  return (await res.json()) as { results: NotionPage[] };
}

export const t = (prop: any): string =>
  (prop?.title?.[0]?.plain_text || prop?.rich_text?.[0]?.plain_text || "").trim();

export const sel = (prop: any): string => prop?.select?.name || "";

export const multi = (prop: any): string[] =>
  (prop?.multi_select || []).map((s: any) => s.name);

export const num = (prop: any): number | null =>
  prop?.number === null || prop?.number === undefined ? null : prop.number;

export const chk = (prop: any): boolean => Boolean(prop?.checkbox);

export const date = (prop: any): string => prop?.date?.start || "";

export const url = (prop: any): string => prop?.url || "";

export const rel = (prop: any): string[] =>
  (prop?.relation || []).map((r: any) => r.id);
