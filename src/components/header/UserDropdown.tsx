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
    return <div className="text-xs text-gray-400">…</div>;
  }

  if (!session?.user) {
    return (
      <Link
        href="/signin"
        className="rounded bg-emerald-500 px-3 py-1.5 text-sm font-medium text-white"
      >
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
        className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-800"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500 text-sm font-semibold text-white">
          {initials}
        </span>
        <span className="hidden text-sm font-medium text-gray-700 dark:text-gray-200 md:block">
          {session.user.name || session.user.email}
        </span>
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-64 rounded-xl border border-gray-200 bg-white p-3 shadow-lg dark:border-gray-700 dark:bg-gray-900">
          <div className="border-b border-gray-100 pb-3 dark:border-gray-800">
            <div className="text-sm font-medium text-gray-800 dark:text-gray-100">
              {session.user.name || "Account"}
            </div>
            <div className="mt-0.5 text-xs text-gray-500">{session.user.email}</div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/signin" })}
            className="mt-3 w-full rounded-lg bg-gray-100 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
