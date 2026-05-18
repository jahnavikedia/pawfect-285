import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { Pet, Choice } from "@/lib/types";

export const dynamic = "force-dynamic";

type Row = Pet & {
  yes_count: number;
  no_count: number;
  skip_count: number;
  total_votes: number;
  user_choice: Choice | null;
};

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id: idRaw } = await ctx.params;
  const id = Number.parseInt(idRaw, 10);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  }
  const userId = req.nextUrl.searchParams.get("userId") ?? "";

  const pet = db.prepare("SELECT * FROM pets WHERE id = ?").get(id) as Pet | undefined;
  if (!pet) return NextResponse.json({ error: "not found" }, { status: 404 });

  const counts = db
    .prepare(
      `SELECT
        COALESCE(SUM(CASE WHEN choice='yes'  THEN 1 ELSE 0 END), 0) AS yes_count,
        COALESCE(SUM(CASE WHEN choice='no'   THEN 1 ELSE 0 END), 0) AS no_count,
        COALESCE(SUM(CASE WHEN choice='skip' THEN 1 ELSE 0 END), 0) AS skip_count,
        COUNT(*)                                                     AS total_votes
       FROM votes WHERE pet_id = ?`,
    )
    .get(id) as Omit<Row, keyof Pet | "user_choice">;

  const userChoice = userId
    ? (db
        .prepare("SELECT choice FROM votes WHERE pet_id = ? AND user_id = ?")
        .get(id, userId) as { choice: Choice } | undefined)
    : undefined;

  const row: Row = {
    ...pet,
    ...counts,
    user_choice: userChoice?.choice ?? null,
  };

  return NextResponse.json({ pet: row });
}
