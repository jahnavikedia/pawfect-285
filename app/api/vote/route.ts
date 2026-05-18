import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

const VALID = new Set(["yes", "no", "skip"]);

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const { petId, userId, choice, decisionMs } = (body ?? {}) as {
    petId?: number;
    userId?: string;
    choice?: string;
    decisionMs?: number;
  };

  if (
    !Number.isInteger(petId) ||
    !userId ||
    typeof userId !== "string" ||
    !choice ||
    !VALID.has(choice)
  ) {
    return NextResponse.json({ error: "missing or invalid fields" }, { status: 400 });
  }

  const pet = db.prepare("SELECT id FROM pets WHERE id = ?").get(petId);
  if (!pet) return NextResponse.json({ error: "unknown pet" }, { status: 404 });

  const now = Date.now();
  const decision =
    typeof decisionMs === "number" && Number.isFinite(decisionMs) && decisionMs >= 0
      ? Math.min(decisionMs, 5 * 60 * 1000)
      : null;

  db.prepare(
    `INSERT INTO votes (pet_id, user_id, choice, created_at, decision_ms)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(pet_id, user_id) DO UPDATE SET
       choice = excluded.choice,
       created_at = excluded.created_at,
       decision_ms = excluded.decision_ms`,
  ).run(petId, userId, choice, now, decision);

  db.prepare(
    `INSERT INTO users (user_id, display_name, first_seen, last_seen)
     VALUES (?, NULL, ?, ?)
     ON CONFLICT(user_id) DO UPDATE SET last_seen = excluded.last_seen`,
  ).run(userId, now, now);

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  const petIdRaw = req.nextUrl.searchParams.get("petId");
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  if (petIdRaw) {
    const petId = Number.parseInt(petIdRaw, 10);
    if (!Number.isInteger(petId)) {
      return NextResponse.json({ error: "invalid petId" }, { status: 400 });
    }
    const info = db
      .prepare("DELETE FROM votes WHERE user_id = ? AND pet_id = ?")
      .run(userId, petId);
    return NextResponse.json({ ok: true, removed: info.changes });
  }

  const info = db.prepare("DELETE FROM votes WHERE user_id = ?").run(userId);
  return NextResponse.json({ ok: true, removed: info.changes });
}
