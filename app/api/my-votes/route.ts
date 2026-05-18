import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { Pet, Choice } from "@/lib/types";

export const dynamic = "force-dynamic";

type Row = Pet & {
  user_choice: Choice;
  voted_at: number;
  yes_count: number;
  no_count: number;
  skip_count: number;
  total_votes: number;
  yes_rate: number;
};

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  const rows = db
    .prepare(
      `SELECT
         p.*,
         mine.choice     AS user_choice,
         mine.created_at AS voted_at,
         COALESCE(c.yes_count, 0)   AS yes_count,
         COALESCE(c.no_count,  0)   AS no_count,
         COALESCE(c.skip_count, 0)  AS skip_count,
         COALESCE(c.total_votes, 0) AS total_votes,
         CASE
           WHEN COALESCE(c.yes_count, 0) + COALESCE(c.no_count, 0) = 0 THEN 0.0
           ELSE 1.0 * COALESCE(c.yes_count, 0)
                / (COALESCE(c.yes_count, 0) + COALESCE(c.no_count, 0))
         END AS yes_rate
       FROM votes mine
       JOIN pets p ON p.id = mine.pet_id
       LEFT JOIN (
         SELECT pet_id,
                SUM(CASE WHEN choice='yes'  THEN 1 ELSE 0 END) AS yes_count,
                SUM(CASE WHEN choice='no'   THEN 1 ELSE 0 END) AS no_count,
                SUM(CASE WHEN choice='skip' THEN 1 ELSE 0 END) AS skip_count,
                COUNT(*)                                        AS total_votes
         FROM votes
         GROUP BY pet_id
       ) c ON c.pet_id = p.id
       WHERE mine.user_id = ?
       ORDER BY mine.created_at DESC`,
    )
    .all(userId) as Row[];

  const counts = {
    yes:  rows.filter((r) => r.user_choice === "yes").length,
    no:   rows.filter((r) => r.user_choice === "no").length,
    skip: rows.filter((r) => r.user_choice === "skip").length,
    total: rows.length,
  };

  return NextResponse.json({ votes: rows, counts });
}
