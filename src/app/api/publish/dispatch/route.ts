import { NextRequest, NextResponse } from "next/server";
import {
  getNotionToken,
  loadEnvFile,
  NICOM_ENV_FILE,
  NOTION_API,
  NOTION_VERSION,
} from "@/lib/nicom-config";
import { t, sel, url as urlProp } from "@/lib/notion";

export const dynamic = "force-dynamic";

type PublishPayload = {
  sku_id: string;
  title: string;
  caption: string;
  mediaUrls: string[];
  platforms: string[];
  approved: "true";
  source: "nicom-dashboard";
  notion_plan_id: string;
  format: string;
};

const CHANNEL_TO_FORMAT: Record<string, string> = {
  "IG Post": "ig_post",
  "IG Stories": "ig_stories",
  "IG Reel": "ig_reel",
  Carousel: "carousel",
  "Reels Seed": "reels_seed",
  TikTok: "tiktok",
};

function platformsForChannel(channel: string): string[] {
  if (channel === "TikTok") return ["tiktok"];
  return ["instagram"];
}

export async function POST(req: NextRequest) {
  const token = getNotionToken();
  if (!token) return NextResponse.json({ error: "NOTION_TOKEN not set" }, { status: 500 });

  const body = await req.json().catch(() => ({}));
  const pageId = String(body.page_id || "").trim();
  if (!pageId) return NextResponse.json({ error: "page_id required" }, { status: 400 });

  const env = loadEnvFile(NICOM_ENV_FILE);
  const webhook = env.N8N_PUBLISH_WEBHOOK_URL || process.env.N8N_PUBLISH_WEBHOOK_URL || "";
  const apiKey = env.NICOM_SOCIAL_API_KEY || process.env.NICOM_SOCIAL_API_KEY || "";
  if (!webhook) {
    return NextResponse.json({ error: "N8N_PUBLISH_WEBHOOK_URL not set" }, { status: 503 });
  }

  // 1. Fetch the Content Plan row
  const pageRes = await fetch(`${NOTION_API}/pages/${pageId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Notion-Version": NOTION_VERSION,
    },
  });
  if (!pageRes.ok) {
    const body = await pageRes.text();
    return NextResponse.json({ error: `notion page fetch: ${body}` }, { status: 502 });
  }
  const page = (await pageRes.json()) as { properties?: Record<string, unknown> };
  const props = page.properties || {};

  const sku = t(props["SKU"]);
  const channel = sel(props["Channel"]);
  const caption = t(props["Brief"]) || t(props["Headline UA"]) || "";
  const outputUrl = urlProp(props["Output URL"]);
  const title = t(props["Post Title"]) || `${sku} / ${channel}`;

  if (!sku) return NextResponse.json({ error: "row missing SKU" }, { status: 422 });
  if (!outputUrl || !outputUrl.startsWith("https://")) {
    return NextResponse.json(
      { error: "Output URL is empty or not https — cannot publish" },
      { status: 422 }
    );
  }

  const payload: PublishPayload = {
    sku_id: sku,
    title,
    caption,
    mediaUrls: [outputUrl],
    platforms: platformsForChannel(channel),
    approved: "true",
    source: "nicom-dashboard",
    notion_plan_id: pageId,
    format: CHANNEL_TO_FORMAT[channel] || "ig_post",
  };

  // 2. Fire-and-forget POST with 1 retry (dashboard caller doesn't wait long).
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (apiKey) headers["x-nicom-api-key"] = apiKey;

  let lastErr = "";
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const dispatchRes = await fetch(webhook, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(15000),
      });
      if (dispatchRes.ok) {
        return NextResponse.json({
          ok: true,
          attempt,
          sku,
          platforms: payload.platforms,
          webhook_status: dispatchRes.status,
        });
      }
      lastErr = `HTTP ${dispatchRes.status}: ${(await dispatchRes.text()).slice(0, 200)}`;
    } catch (err) {
      lastErr = err instanceof Error ? err.message : String(err);
    }
    if (attempt < 2) await new Promise((r) => setTimeout(r, 1000));
  }

  return NextResponse.json(
    { error: `publish dispatch failed: ${lastErr}`, sku, payload },
    { status: 502 }
  );
}
