import { NextResponse } from "next/server";
import { queryNotionDB, t, multi } from "@/lib/notion";
import { NOTION_PERSONAS_DB } from "@/lib/nicom-config";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await queryNotionDB(NOTION_PERSONAS_DB);
    const items = data.results.map((page) => {
      const p = page.properties;
      return {
        id: page.id,
        name: t(p["Name"]),
        identity: t(p["Identity"]),
        visual_archetype: t(p["Visual archetype"]),
        sample_phrases: t(p["Sample phrases"]),
        voice_do: multi(p["Voice DO"]),
        voice_dont: multi(p["Voice DON'T"]),
      };
    });
    return NextResponse.json({ items });
  } catch (err: any) {
    return NextResponse.json({ error: String(err.message || err) }, { status: 500 });
  }
}
