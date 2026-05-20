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
      <h1 className="text-xl font-semibold text-[var(--color-nicom-text)] mb-4">Change password</h1>
      <form
        onSubmit={handleSubmit}
        className="nicom-surface space-y-4 p-6"
      >
        <div>
          <label className="text-sm font-medium text-[var(--color-nicom-muted)] mb-1 block">
            Current password
          </label>
          <input
            type="password"
            required
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            className="w-full rounded-lg border border-[var(--color-nicom-border)] bg-[var(--color-nicom-elev)] px-3 py-2 text-sm text-[var(--color-nicom-text)]"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-[var(--color-nicom-muted)] mb-1 block">
            New password (≥8 chars)
          </label>
          <input
            type="password"
            required
            minLength={8}
            value={next}
            onChange={(e) => setNext(e.target.value)}
            className="w-full rounded-lg border border-[var(--color-nicom-border)] bg-[var(--color-nicom-elev)] px-3 py-2 text-sm text-[var(--color-nicom-text)]"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-[var(--color-nicom-muted)] mb-1 block">
            Confirm new password
          </label>
          <input
            type="password"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="w-full rounded-lg border border-[var(--color-nicom-border)] bg-[var(--color-nicom-elev)] px-3 py-2 text-sm text-[var(--color-nicom-text)]"
          />
        </div>
        {err && (
          <div className="rounded bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/30 px-3 py-2 text-sm text-[var(--color-danger)]">
            {err}
          </div>
        )}
        {ok && (
          <div className="rounded bg-[var(--color-ok)]/10 border border-[var(--color-ok)]/30 px-3 py-2 text-sm text-[var(--color-ok)]">
            Password changed. Signing out…
          </div>
        )}
        <button
          disabled={busy || ok}
          type="submit"
          className="w-full rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {busy ? "Updating…" : "Change password"}
        </button>
      </form>
    </div>
  );
}
