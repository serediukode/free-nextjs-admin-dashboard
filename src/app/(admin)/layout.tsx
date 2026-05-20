"use client";

import AppHeader from "@/layout/AppHeader";
import React from "react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col" style={{ background: "var(--color-nicom-bg)" }}>
      <AppHeader />
      <main
        className="flex-1"
        style={{ padding: "32px 40px 60px", maxWidth: "1600px", width: "100%", margin: "0 auto", overflowX: "hidden", minWidth: 0 }}
      >
        {children}
      </main>
      <footer
        className="border-t"
        style={{
          padding: "12px 32px",
          borderColor: "var(--color-nicom-border)",
          background: "var(--color-nicom-bg)",
          fontFamily: "var(--font-mono)",
          fontSize: "10px",
          color: "var(--color-nicom-faint)",
          letterSpacing: "1.2px",
          textTransform: "uppercase",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <span>4 brands · 10 SKU · LangGraph 6-agent pipeline</span>
        <span>Nicom Studio v0.9.8</span>
      </footer>
    </div>
  );
}
