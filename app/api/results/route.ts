import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { ResultRow, SortKey } from "@/lib/types";

export const dynamic = "force-dynamic";

const SORT_ORDER: Record<SortKey, string> = {
  "most-loved":    "yes_pct DESC, total_votes DESC, p.id ASC",
  "least-loved":   "yes_pct ASC,  total_votes DESC, p.id ASC",
  "most-divisive": "divisiveness DESC, total_votes DESC, p.id ASC",
  "most-skipped":  "skip_count DESC, total_votes DESC, p.id ASC",
  "most-voted":    "total_votes DESC, yes_pct DESC, p.id ASC",
};

function isSortKey(s: string | null): s is SortKey {
  return !!s && s in SORT_ORDER;
}

export async function GET(req: NextRequest) {
  const sortParam = req.nextUrl.searchParams.get("sort");
  const sort: SortKey = isSortKey(sortParam) ? sortParam : "most-loved";
  const species = req.nextUrl.searchParams.get("species");

  const speciesFilter = species && species !== "All" ? "WHERE p.species = ?" : "";
  const params = species && species !== "All" ? [species] : [];

  const sql = `
    SELECT
      p.id, p.name, p.species, p.breed, p.age, p.tagline, p.image_url, p.accent,
      COALESCE(SUM(CASE WHEN v.choice='yes'  THEN 1 ELSE 0 END), 0) AS yes_count,
      COALESCE(SUM(CASE WHEN v.choice='no'   THEN 1 ELSE 0 END), 0) AS no_count,
      COALESCE(SUM(CASE WHEN v.choice='skip' THEN 1 ELSE 0 END), 0) AS skip_count,
      COALESCE(COUNT(v.id), 0)                                       AS total_votes,
      CASE
        WHEN COALESCE(SUM(CASE WHEN v.choice IN ('yes','no') THEN 1 ELSE 0 END), 0) = 0 THEN 0.0
        ELSE 1.0 * SUM(CASE WHEN v.choice='yes' THEN 1 ELSE 0 END)
             / SUM(CASE WHEN v.choice IN ('yes','no') THEN 1 ELSE 0 END)
      END AS yes_pct,
      MIN(
        COALESCE(SUM(CASE WHEN v.choice='yes' THEN 1 ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN v.choice='no'  THEN 1 ELSE 0 END), 0)
      ) AS divisiveness
    FROM pets p
    LEFT JOIN votes v ON v.pet_id = p.id
    ${speciesFilter}
    GROUP BY p.id
    ORDER BY ${SORT_ORDER[sort]}
  `;

  const rows = db.prepare(sql).all(...params) as ResultRow[];

  const totalVoters = (db
    .prepare("SELECT COUNT(DISTINCT user_id) AS n FROM votes")
    .get() as { n: number }).n;

  const totalVotes = (db
    .prepare("SELECT COUNT(*) AS n FROM votes")
    .get() as { n: number }).n;

  return NextResponse.json({
    results: rows,
    sort,
    species: species ?? "All",
    totals: { voters: totalVoters, votes: totalVotes, pets: rows.length },
  });
}
