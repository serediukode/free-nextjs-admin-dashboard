import { getNotionToken, NOTION_API, NOTION_VERSION } from "@/lib/nicom-config";

export type NotionProp = Record<string, unknown>;
export type NotionPage = {
  id: string;
  properties: Record<string, NotionProp>;
  [k: string]: unknown;
};

export async function queryNotionDB(dbId: string, body: Record<string, unknown> = {}) {
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

// Notion property accessors — use unknown then narrow via optional chaining.
type AnyProp = unknown;
function asObj(p: AnyProp): Record<string, unknown> | undefined {
  return p && typeof p === "object" ? (p as Record<string, unknown>) : undefined;
}

export const t = (prop: AnyProp): string => {
  const o = asObj(prop);
  const title = (o?.title as Array<{ plain_text?: string }> | undefined)?.[0]?.plain_text;
  const rich = (o?.rich_text as Array<{ plain_text?: string }> | undefined)?.[0]?.plain_text;
  return (title || rich || "").trim();
};

export const sel = (prop: AnyProp): string =>
  ((asObj(prop)?.select as { name?: string } | undefined)?.name) || "";

export const multi = (prop: AnyProp): string[] => {
  const arr = asObj(prop)?.multi_select as Array<{ name?: string }> | undefined;
  return (arr || []).map((s) => s.name || "").filter(Boolean);
};

export const num = (prop: AnyProp): number | null => {
  const v = asObj(prop)?.number;
  return v === null || v === undefined ? null : (v as number);
};

export const chk = (prop: AnyProp): boolean =>
  Boolean(asObj(prop)?.checkbox);

export const date = (prop: AnyProp): string =>
  ((asObj(prop)?.date as { start?: string } | undefined)?.start) || "";

export const url = (prop: AnyProp): string =>
  (asObj(prop)?.url as string | undefined) || "";

export const rel = (prop: AnyProp): string[] => {
  const arr = asObj(prop)?.relation as Array<{ id?: string }> | undefined;
  return (arr || []).map((r) => r.id || "").filter(Boolean);
};
