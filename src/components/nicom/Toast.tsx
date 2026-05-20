"use client";
import { createContext, useCallback, useContext, useRef, useState } from "react";

interface ToastCtx { show: (msg: string) => void }
const Ctx = createContext<ToastCtx>({ show: () => {} });

export function useToast() { return useContext(Ctx); }

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [msg, setMsg] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback((m: string) => {
    setMsg(m);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setMsg(null), 2400);
  }, []);

  return (
    <Ctx.Provider value={{ show }}>
      {children}
      {msg && (
        <div
          style={{
            position: "fixed",
            bottom: "28px",
            left: "50%",
            transform: "translateX(-50%)",
            background: "var(--color-nicom-text)",
            color: "var(--color-nicom-bg)",
            padding: "10px 20px",
            borderRadius: "6px",
            fontFamily: "var(--font-mono)",
            fontSize: "11px",
            letterSpacing: "1px",
            textTransform: "uppercase",
            zIndex: 999999,
            boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
            animation: "onyx-enter 0.2s cubic-bezier(0.2,0.9,0.3,1) both",
            pointerEvents: "none",
          }}
        >
          {msg}
        </div>
      )}
    </Ctx.Provider>
  );
}
