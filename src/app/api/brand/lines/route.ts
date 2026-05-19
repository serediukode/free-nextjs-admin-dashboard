import { NextResponse } from "next/server";
import { queryNotionDB, t, sel, multi, num, chk } from "@/lib/notion";
import { NOTION_BRAND_LINES_DB } from "@/lib/nicom-config";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await queryNotionDB(NOTION_BRAND_LINES_DB);
    const items = data.results.map((page) => {
      const p = page.properties;
      return {
        id: page.id,
        name: t(p["Name"]),
        is_hero: chk(p["Hero"]),
        share_of_sales: num(p["Share of sales"]),
        compliance_profile: sel(p["Compliance profile"]),
        persona: sel(p["Persona"]),
        tone_of_voice: t(p["Tone of voice"]),
        visual_style: t(p["Visual style"]),
        primary_color: t(p["Primary color"]),
        accent_color: t(p["Accent color"]),
        neutral_color: t(p["Neutral color"]),
        headline_font: t(p["Headline font"]),
        body_font: t(p["Body font"]),
        mood: multi(p["Mood"]),
        avoid: multi(p["Avoid"]),
      };
    });
    return NextResponse.json({ items });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
