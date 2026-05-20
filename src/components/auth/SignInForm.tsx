"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";

export default function SignInForm() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") || "/";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    const res = await signIn("credentials", { email, password, redirect: false });
    setBusy(false);
    if (res?.error) { setErr("Invalid email or password."); return; }
    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--color-nicom-bg)", padding: "40px 20px" }}>
      <div style={{ width: "100%", maxWidth: "400px", animation: "onyx-enter 0.4s cubic-bezier(0.2,0.9,0.3,1) both" }}>
        {/* Brand mark */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "40px" }}>
          <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "linear-gradient(135deg, var(--color-pablo) 0%, var(--color-pablo-wine) 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "16px", color: "var(--color-nicom-bg)" }}>N</div>
          <div>
            <div style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: "16px", color: "var(--color-nicom-text)" }}>Nicom Studio</div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--color-nicom-faint)", letterSpacing: "1.2px", textTransform: "uppercase" }}>Control Center</div>
          </div>
        </div>

        {/* Form card */}
        <div style={{ background: "var(--color-nicom-surface)", border: "0.5px solid var(--color-nicom-border-strong)", borderRadius: "14px", padding: "32px" }}>
          <div style={{ marginBottom: "24px" }}>
            <div style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: "24px", color: "var(--color-nicom-text)", letterSpacing: "-0.3px", marginBottom: "6px" }}>Sign in</div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--color-nicom-faint)", letterSpacing: "0.5px" }}>Enter your credentials to access the dashboard</div>
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "9.5px", color: "var(--color-nicom-faint)", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: "6px" }}>Email</div>
              <input type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)}
                style={{ width: "100%", padding: "10px 12px", background: "var(--color-nicom-elev)", border: "0.5px solid var(--color-nicom-border)", borderRadius: "4px", color: "var(--color-nicom-text)", fontFamily: "var(--font-mono)", fontSize: "12px", outline: "none", boxSizing: "border-box" }}
                onFocus={e => (e.target.style.borderColor = "var(--color-pablo)")}
                onBlur={e => (e.target.style.borderColor = "var(--color-nicom-border)")} />
            </div>
            <div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "9.5px", color: "var(--color-nicom-faint)", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: "6px" }}>Password</div>
              <input type="password" required autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)}
                style={{ width: "100%", padding: "10px 12px", background: "var(--color-nicom-elev)", border: "0.5px solid var(--color-nicom-border)", borderRadius: "4px", color: "var(--color-nicom-text)", fontFamily: "var(--font-mono)", fontSize: "12px", outline: "none", boxSizing: "border-box" }}
                onFocus={e => (e.target.style.borderColor = "var(--color-pablo)")}
                onBlur={e => (e.target.style.borderColor = "var(--color-nicom-border)")} />
            </div>
            {err && (
              <div style={{ background: "rgba(217,112,112,0.08)", border: "0.5px solid rgba(217,112,112,0.3)", borderRadius: "6px", padding: "10px 14px", fontSize: "12px", color: "var(--color-danger)", fontFamily: "var(--font-mono)" }}>{err}</div>
            )}
            <button disabled={busy} type="submit"
              style={{ width: "100%", padding: "12px 16px", background: busy ? "var(--color-nicom-elev)" : "var(--color-pablo)", color: busy ? "var(--color-nicom-faint)" : "var(--color-nicom-bg)", border: `0.5px solid ${busy ? "var(--color-nicom-border)" : "var(--color-pablo)"}`, borderRadius: "6px", fontFamily: "var(--font-mono)", fontSize: "11px", letterSpacing: "1.2px", textTransform: "uppercase", fontWeight: 600, cursor: busy ? "not-allowed" : "pointer", transition: "all 0.2s" }}>
              {busy ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>

        <div style={{ marginTop: "20px", textAlign: "center", fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--color-nicom-faint)", letterSpacing: "0.5px" }}>
          Need an account?{" "}
          <Link href="/signup" style={{ color: "var(--color-pablo)" }}>Sign up</Link>
        </div>
      </div>
    </div>
  );
}
