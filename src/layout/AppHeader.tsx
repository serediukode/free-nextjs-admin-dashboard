"use client";
import UserDropdown from "@/components/header/UserDropdown";
import { useSidebar } from "@/context/SidebarContext";
import Link from "next/link";
import React from "react";

const AppHeader: React.FC = () => {
  const { isMobileOpen, toggleSidebar, toggleMobileSidebar } = useSidebar();

  const handleToggle = () => {
    if (window.innerWidth >= 1024) toggleSidebar();
    else toggleMobileSidebar();
  };

  return (
    <header
      className="sticky top-0 z-99999 flex w-full items-center justify-between border-b px-4 lg:px-6"
      style={{ height: "52px", background: "var(--color-nicom-bg)", borderColor: "var(--color-nicom-hairline)" }}
    >
      {/* Left: toggle + mobile logo */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleToggle}
          aria-label="Toggle Sidebar"
          className="flex h-9 w-9 items-center justify-center rounded-lg border transition-colors"
          style={{ borderColor: "var(--color-nicom-hairline)", color: "var(--color-nicom-faint)" }}
        >
          {isMobileOpen ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path fillRule="evenodd" clipRule="evenodd"
                d="M6.22 7.28a1 1 0 011.41-1.41L12 10.59l4.36-4.72a1 1 0 111.46 1.37L13.06 12l4.76 4.86a1 1 0 11-1.43 1.4L12 13.41l-4.36 4.72a1 1 0 01-1.46-1.37L10.94 12 6.22 7.28z"
                fill="currentColor" />
            </svg>
          ) : (
            <svg width="15" height="11" viewBox="0 0 16 12" fill="none">
              <path fillRule="evenodd" clipRule="evenodd"
                d="M.583 1A.75.75 0 011.333.25h13.333a.75.75 0 010 1.5H1.333A.75.75 0 01.583 1zm0 10a.75.75 0 01.75-.75h13.333a.75.75 0 010 1.5H1.333a.75.75 0 01-.75-.75zm.75-5.75a.75.75 0 000 1.5H8a.75.75 0 000-1.5H1.333z"
                fill="currentColor" />
            </svg>
          )}
        </button>

        <Link href="/" className="flex items-center gap-2 lg:hidden">
          <span
            className="flex h-7 w-7 items-center justify-center rounded-md text-xs font-bold text-white"
            style={{ background: "var(--color-accent)" }}
          >N</span>
          <span className="text-sm font-semibold tracking-tight" style={{ color: "var(--color-nicom-text)" }}>NICOM</span>
        </Link>
      </div>

      {/* Right: status chips + user */}
      <div className="flex items-center gap-3">
        <div className="hidden items-center gap-2 lg:flex">
          <span className="nicom-chip nicom-chip-ok">PRODUCTION</span>
          <span className="nicom-chip">v0.9.8</span>
        </div>
        <UserDropdown />
      </div>
    </header>
  );
};

export default AppHeader;
