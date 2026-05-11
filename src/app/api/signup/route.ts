import { NextRequest, NextResponse } from "next/server";
import { createUser, userCount } from "@/lib/users";

const ALLOW_OPEN_SIGNUP = process.env.NICOM_ALLOW_OPEN_SIGNUP === "1";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const email = String(body.email || "").trim();
  const password = String(body.password || "");
  const name = String(body.name || "").trim();

  // First-ever user is always allowed (bootstrap). Subsequent users only if open signup is on.
  const existing = userCount();
  if (existing > 0 && !ALLOW_OPEN_SIGNUP) {
    return NextResponse.json(
      { error: "Signup is closed. Ask an admin to invite you." },
      { status: 403 }
    );
  }

  try {
    const id = await createUser({ email, password, name });
    return NextResponse.json({ ok: true, id, first_user: existing === 0 });
  } catch (err: any) {
    return NextResponse.json({ error: String(err.message || err) }, { status: 400 });
  }
}
