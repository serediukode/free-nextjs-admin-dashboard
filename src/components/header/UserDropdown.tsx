"use client";

import { useState, useRef, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";

export default function UserDropdown() {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  if (status === "loading") {
    return <div className="nicom-mono text-[9px]" style={{ color: "var(--color-nicom-faint)" }}>…</div>;
  }

  if (!session?.user) {
    return (
      <Link href="/signin" className="btn-onyx-primary" style={{ fontSize: "10px", padding: "7px 14px" }}>
        Sign in
      </Link>
    );
  }

  const initials =
    (session.user.name || session.user.email || "?")
      .split(/\s+/)
      .map((s) => s[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?";

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-lg px-2 py-1 transition-colors"
        style={{ background: "transparent" }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "var(--color-nicom-elev)")}
        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
      >
        <span
          className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold"
          style={{
            background: "linear-gradient(135deg, var(--color-pablo) 0%, var(--color-pablo-wine) 100%)",
            color: "var(--color-nicom-bg)",
          }}
        >
          {initials}
        </span>
        <span className="hidden text-xs font-medium md:block nicom-mono" style={{ color: "var(--color-nicom-muted)", letterSpacing: "0.5px" }}>
          {session.user.name || session.user.email}
        </span>
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 w-52 overflow-hidden"
          style={{
            background: "var(--color-nicom-surface)",
            border: "0.5px solid var(--color-nicom-border-strong)",
            borderRadius: "8px",
            boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
            animation: "onyx-enter 0.2s cubic-bezier(0.2,0.9,0.3,1) both",
            zIndex: 999999,
          }}
        >
          <div className="px-4 py-3" style={{ borderBottom: "0.5px solid var(--color-nicom-border)" }}>
            <div className="nicom-mono text-[9px] uppercase tracking-widest mb-1" style={{ color: "var(--color-nicom-faint)" }}>Account</div>
            <div className="text-sm font-medium" style={{ color: "var(--color-nicom-text)" }}>{session.user.name || "User"}</div>
            <div className="nicom-mono text-[10px]" style={{ color: "var(--color-nicom-faint)" }}>{session.user.email}</div>
          </div>

          <div className="py-1">
            {[
              { label: "Settings",        path: "/settings" },
              { label: "Change Password", path: "/change-password" },
            ].map((item) => (
              <Link
                key={item.path}
                href={item.path}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 px-4 py-2.5 nicom-mono text-[10px] uppercase tracking-wider transition-colors"
                style={{ color: "var(--color-nicom-muted)" }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "var(--color-nicom-elev)";
                  (e.currentTarget as HTMLElement).style.color = "var(--color-nicom-text)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "transparent";
                  (e.currentTarget as HTMLElement).style.color = "var(--color-nicom-muted)";
                }}
              >
                <span style={{ color: "var(--color-pablo)", fontSize: "9px" }}>◇</span>
                {item.label}
              </Link>
            ))}
          </div>

          <div className="p-2" style={{ borderTop: "0.5px solid var(--color-nicom-border)" }}>
            <button
              onClick={() => signOut({ callbackUrl: "/signin" })}
              className="w-full rounded px-3 py-2 text-left nicom-mono text-[10px] uppercase tracking-wider transition-colors"
              style={{ color: "var(--color-danger)", border: "0.5px solid rgba(217,112,112,0.3)", background: "transparent" }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "rgba(217,112,112,0.06)")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
            >
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
