import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });
  const row = db
    .prepare("SELECT user_id, display_name, first_seen, last_seen FROM users WHERE user_id = ?")
    .get(userId) as { user_id: string; display_name: string | null; first_seen: number; last_seen: number } | undefined;
  return NextResponse.json({ user: row ?? null });
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  const { userId, displayName } = (body ?? {}) as { userId?: string; displayName?: string | null };
  if (!userId || typeof userId !== "string") {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }
  const name =
    displayName == null
      ? null
      : String(displayName).trim().slice(0, 40) || null;

  const now = Date.now();
  db.prepare(
    `INSERT INTO users (user_id, display_name, first_seen, last_seen)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(user_id) DO UPDATE SET
       display_name = excluded.display_name,
       last_seen    = excluded.last_seen`,
  ).run(userId, name, now, now);

  return NextResponse.json({ ok: true, displayName: name });
}
