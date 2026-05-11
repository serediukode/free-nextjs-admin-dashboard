export const NICOM_PROJECT_ROOT = process.env.NICOM_PROJECT_ROOT || "/Users/denys/nicom-machine";
export const NICOM_STATE_DB = `${NICOM_PROJECT_ROOT}/pipeline/agents/.state/nicom_agents.db`;
export const NICOM_ENV_FILE = `${NICOM_PROJECT_ROOT}/pipeline/llemonstack/.env`;
export const NICOM_DAEMON_ENV_FILE = "/Users/denys/Library/Application Support/nicom/.env";

export const NOTION_CONTENT_PLAN_DB = "160e36e3-6e25-48a1-a6e7-a300c171802f";
export const NOTION_GENERATION_LOG_DB = "701992a3-20db-4e18-bc6f-88f3a7753434";
export const NOTION_PRODUCTS_DB = "6d766331-db1f-43ff-b1de-9b1ae86afe29";
export const NOTION_BRAND_LINES_DB = "50596b27-bc97-4b41-869e-9915cbdb20c2";
export const NOTION_PERSONAS_DB = "5dd46bbb-360c-4cd9-906b-0e2f5fb780f9";
export const NOTION_API = "https://api.notion.com/v1";
export const NOTION_VERSION = "2022-06-28";

export function loadEnvFile(path: string): Record<string, string> {
  const fs = require("fs");
  if (!fs.existsSync(path)) return {};
  const out: Record<string, string> = {};
  for (const line of fs.readFileSync(path, "utf-8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const [k, ...rest] = trimmed.split("=");
    out[k.trim()] = rest.join("=").trim();
  }
  return out;
}

export function getNotionToken(): string {
  return loadEnvFile(NICOM_ENV_FILE).NOTION_TOKEN || "";
}
