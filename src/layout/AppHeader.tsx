"use client";
import UserDropdown from "@/components/header/UserDropdown";
import { usePathname } from "next/navigation";
import Link from "next/link";
import React from "react";

const TABS = [
  { label: "Library",  path: "/library" },
  { label: "Calendar", path: "/calendar" },
  { label: "Generate", path: "/generate" },
  { label: "Queue",    path: "/queue" },
  { label: "Agents",   path: "/agents" },
  { label: "Logs",     path: "/logs" },
];

const AppHeader: React.FC = () => {
  const pathname = usePathname();
  const isActive = (path: string) => {
    if (path === "/" && pathname === "/") return true;
    if (path !== "/" && pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <header className="onyx-topbar">
      {/* Left: brand */}
      <Link href="/" className="flex items-center gap-3 no-underline">
        <div className="onyx-brand-mark">N</div>
        <div>
          <div className="onyx-brand-title">Nicom Studio</div>
          <div className="onyx-brand-sub">Control Center · Live</div>
        </div>
      </Link>

      {/* Center: tabs */}
      <nav className="onyx-tabs">
        {TABS.map((tab) => (
          <Link
            key={tab.path}
            href={tab.path}
            className={`onyx-tab${isActive(tab.path) ? " active" : ""}`}
          >
            <span className="onyx-tab-ico">◇</span>
            {tab.label}
          </Link>
        ))}
      </nav>

      {/* Right: actions */}
      <div className="flex items-center justify-end gap-3">
        <span className="onyx-pill onyx-pill-ok" style={{ fontSize: "9px" }}>PRODUCTION</span>
        <UserDropdown />
      </div>
    </header>
  );
};

export default AppHeader;
