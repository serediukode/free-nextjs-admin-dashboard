import { NextResponse } from "next/server";
import { queryNotionDB, t, sel, multi, num } from "@/lib/notion";
import { NOTION_PRODUCTS_DB } from "@/lib/nicom-config";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await queryNotionDB(NOTION_PRODUCTS_DB);
    const items = data.results.map((page) => {
      const p = page.properties;
      return {
        id: page.id,
        name: t(p["Name"]),
        sku_id: t(p["SKU ID"]),
        format: sel(p["Format"]),
        persona: sel(p["Persona"]),
        flavor_family: sel(p["Flavor family"]),
        flavor_notes: multi(p["Flavor notes"]),
        mood_keywords: multi(p["Mood keywords"]),
        tags: multi(p["Tags"]),
        audience: t(p["Audience archetype"]),
        primary_color: t(p["Pack primary color"]),
        accent_color: t(p["Pack accent color"]),
        nicotine_per_pouch: num(p["Nicotine mg/pouch"]),
        nicotine_per_g: num(p["Nicotine mg/g"]),
        pouch_weight: num(p["Pouch weight g"]),
      };
    });
    return NextResponse.json({ items });
  } catch (err: any) {
    return NextResponse.json({ error: String(err.message || err) }, { status: 500 });
  }
}
