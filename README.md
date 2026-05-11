# Nicom Control Center

Real-time dashboard for the Nicom AI SMM Factory.

## What it shows

| Route | Purpose |
|---|---|
| `/` | Live Status — daemon + telegram-bot + n8n heartbeats, content queue counts, unsent alerts |
| `/queue` | Content Plan from Notion with approve/reject buttons |
| `/generate` | Manual pipeline trigger (SKU + format + approval mode), streams stdout via SSE |
| `/logs` | Generation Log feed from Notion (model, compliance, cost, approval) |
| `/settings` | Env keys (masked), Pletor agent count, launchd service state |

## v1 local (this machine)

Requires the daemon project at `/Users/denys/nicom-machine/` and a Notion integration with the
following databases shared:

- Content Plan: `160e36e3-6e25-48a1-a6e7-a300c171802f`
- Generation Log: `701992a3-20db-4e18-bc6f-88f3a7753434`

The dashboard reads `NOTION_TOKEN` from `${NICOM_PROJECT_ROOT}/pipeline/llemonstack/.env`.

```bash
cd /Users/denys/nicom-machine/nicom-dashboard
npm install
npm run dev          # http://localhost:3000
```

Override the daemon project root via `NICOM_PROJECT_ROOT` if the code lives elsewhere.

## v2 Hetzner VPS deploy (planned)

The dashboard needs SSH/HTTP access to:
1. `launchctl list` — replaced by `systemctl status` on Linux (refactor `/api/status`)
2. SQLite state DB — copy or mount the project directory
3. `python3 scripts/run_pipeline.py` — same project mounted, or remote exec via ssh

Approach: deploy as a `docker compose` service alongside the daemon on the VPS, with the
project directory mounted read-only and a writable volume for outputs.

## v3 Vercel + ngrok (planned)

Vercel hosts the UI. A local `ngrok http 4000` tunnel exposes a tiny RPC service on this Mac
that proxies launchctl / state DB / spawn pipeline. The dashboard calls the tunnel URL.

Pros: dashboard reachable from any device. Cons: pipeline runs only when Mac is awake +
ngrok tunnel up.

## API routes

All under `/api`:

- `GET /api/status` — services, queue, heartbeats (refresh on home every 5s)
- `GET /api/content-plan?status=<name>` — Notion Content Plan
- `POST /api/notion/approve` — body `{ page_id, status }`
- `POST /api/generate` — SSE stream of `run_pipeline.py` output
- `GET /api/generation-log` — Notion Generation Log
- `GET /api/settings` — masked env keys, launchd state, Pletor agent count

## Open items

- Auth (NextAuth) — currently unauthenticated, localhost only. Add before any non-local
  deployment.
- Calendar view at `/calendar` — template page still uses the old e-commerce calendar.
  Wire it to Content Plan dates.
- Brand & Intelligence sections in the sidebar are placeholders; pages not yet built.
