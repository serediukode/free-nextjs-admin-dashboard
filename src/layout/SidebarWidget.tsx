import React from "react";

export default function SidebarWidget() {
  return (
    <div
      className="mx-auto mb-8 w-full rounded-lg px-4 py-3"
      style={{ background: "var(--color-nicom-elev)", border: "1px solid var(--color-nicom-hairline)" }}
    >
      <p
        className="mb-1 text-[10px] font-semibold uppercase tracking-wider"
        style={{ color: "var(--color-nicom-faint)" }}
      >
        Nicom AI · SMM Factory
      </p>
      <p className="text-[11px] leading-snug" style={{ color: "var(--color-nicom-faint)" }}>
        VIKA · SBR · Pablo · LangGraph + Pletor
      </p>
    </div>
  );
}
