const OPENCLAW_URL = "https://openclaw-gateway-production-d727.up.railway.app/";

export const metadata = {
  title: "Nicom — Agents (openclaw)",
};

export default function AgentsPage() {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Agents (openclaw)</h1>
        <a
          href={OPENCLAW_URL}
          target="_blank"
          rel="noreferrer"
          className="rounded bg-emerald-500 px-3 py-1.5 text-xs font-medium text-white"
        >
          Open in new tab ↗
        </a>
      </div>
      <p className="text-sm text-gray-500">
        Niko · Research · Compliance personas, memory-wiki, skills runtime.{" "}
        <code className="rounded bg-gray-100 px-1 py-0.5 text-xs dark:bg-gray-800">
          openclaw-gateway-production-d727.up.railway.app
        </code>
      </p>
      <div className="overflow-hidden rounded-2xl border border-gray-200 shadow-sm dark:border-gray-800">
        <iframe
          src={OPENCLAW_URL}
          className="h-[calc(100vh-200px)] w-full bg-white"
          title="openclaw control"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
        />
      </div>
    </div>
  );
}
