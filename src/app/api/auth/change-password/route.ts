import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import Database from "better-sqlite3";
import path from "path";
import { auth } from "@/auth";

const USERS_DB = path.join(process.cwd(), "data", "users.db");

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email)
    return NextResponse.json({ error: "not authenticated" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const current = String(body.current_password || "");
  const next = String(body.new_password || "");
  if (next.length < 8)
    return NextResponse.json({ error: "new password must be ≥8 chars" }, { status: 400 });

  const db = new Database(USERS_DB);
  const user = db
    .prepare("SELECT * FROM users WHERE email = ?")
    .get(session.user.email) as { id: number; password_hash: string } | undefined;
  if (!user) {
    db.close();
    return NextResponse.json({ error: "user not found" }, { status: 404 });
  }

  const ok = await bcrypt.compare(current, user.password_hash);
  if (!ok) {
    db.close();
    return NextResponse.json({ error: "current password incorrect" }, { status: 403 });
  }

  const newHash = await bcrypt.hash(next, 10);
  db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(newHash, user.id);
  db.close();
  return NextResponse.json({ ok: true });
}
