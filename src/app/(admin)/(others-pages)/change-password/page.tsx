"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";

export default function ChangePasswordPage() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (next.length < 8) return setErr("New password must be ≥8 chars");
    if (next !== confirm) return setErr("Passwords don't match");
    setBusy(true);
    const res = await fetch("/api/auth/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ current_password: current, new_password: next }),
    });
    const json = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setErr(json.error || `HTTP ${res.status}`);
    setOk(true);
    setTimeout(() => signOut({ callbackUrl: "/signin" }), 1500);
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-4 text-xl font-semibold">Change password</h1>
      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900"
      >
        <div>
          <label className="mb-1 block text-sm font-medium">Current password</label>
          <input
            type="password"
            required
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">New password (≥8 chars)</label>
          <input
            type="password"
            required
            minLength={8}
            value={next}
            onChange={(e) => setNext(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Confirm new password</label>
          <input
            type="password"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
          />
        </div>
        {err && <div className="rounded bg-rose-100 px-3 py-2 text-sm text-rose-700">{err}</div>}
        {ok && (
          <div className="rounded bg-emerald-100 px-3 py-2 text-sm text-emerald-700">
            Password changed. Signing out…
          </div>
        )}
        <button
          disabled={busy || ok}
          type="submit"
          className="w-full rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {busy ? "Updating…" : "Change password"}
        </button>
      </form>
    </div>
  );
}
