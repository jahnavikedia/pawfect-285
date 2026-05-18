import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { Pet, PetWithUserVote } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId") ?? "";

  if (!userId) {
    const pets = db.prepare("SELECT * FROM pets ORDER BY id").all() as Pet[];
    return NextResponse.json({ pets });
  }

  const rows = db
    .prepare(
      `SELECT p.*, v.choice AS user_choice
       FROM pets p
       LEFT JOIN votes v ON v.pet_id = p.id AND v.user_id = ?
       ORDER BY p.id`,
    )
    .all(userId) as PetWithUserVote[];

  return NextResponse.json({ pets: rows });
}
