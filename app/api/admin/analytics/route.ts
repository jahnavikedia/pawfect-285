import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const totals = db
    .prepare(
      `SELECT
         COUNT(*)                                                AS swipes,
         SUM(CASE WHEN choice='yes'  THEN 1 ELSE 0 END)          AS yes_swipes,
         SUM(CASE WHEN choice='no'   THEN 1 ELSE 0 END)          AS no_swipes,
         SUM(CASE WHEN choice='skip' THEN 1 ELSE 0 END)          AS skip_swipes,
         COUNT(DISTINCT user_id)                                  AS sessions,
         AVG(decision_ms)                                         AS avg_decision_ms,
         (SELECT COUNT(*) FROM pets)                              AS total_pets
       FROM votes`,
    )
    .get() as {
      swipes: number;
      yes_swipes: number | null;
      no_swipes: number | null;
      skip_swipes: number | null;
      sessions: number;
      avg_decision_ms: number | null;
      total_pets: number;
    };

  const perSpecies = db
    .prepare(
      `SELECT p.species,
              COUNT(v.id) AS votes,
              SUM(CASE WHEN v.choice='yes' THEN 1 ELSE 0 END) AS yes_votes,
              SUM(CASE WHEN v.choice IN ('yes','no') THEN 1 ELSE 0 END) AS decisive,
              CASE
                WHEN SUM(CASE WHEN v.choice IN ('yes','no') THEN 1 ELSE 0 END) = 0 THEN 0.0
                ELSE 1.0 * SUM(CASE WHEN v.choice='yes' THEN 1 ELSE 0 END)
                   / SUM(CASE WHEN v.choice IN ('yes','no') THEN 1 ELSE 0 END)
              END AS yes_rate
       FROM pets p
       LEFT JOIN votes v ON v.pet_id = p.id
       GROUP BY p.species
       ORDER BY votes DESC, p.species ASC`,
    )
    .all() as {
      species: string;
      votes: number;
      yes_votes: number | null;
      decisive: number | null;
      yes_rate: number;
    }[];

  const recentVoters = db
    .prepare(
      `SELECT u.user_id, u.display_name, u.first_seen, u.last_seen,
              (SELECT COUNT(*) FROM votes v WHERE v.user_id = u.user_id) AS vote_count
       FROM users u
       ORDER BY u.last_seen DESC
       LIMIT 25`,
    )
    .all() as {
      user_id: string;
      display_name: string | null;
      first_seen: number;
      last_seen: number;
      vote_count: number;
    }[];

  const topLoved = db
    .prepare(
      `SELECT p.id, p.name, p.species,
              SUM(CASE WHEN v.choice='yes' THEN 1 ELSE 0 END) AS yes,
              SUM(CASE WHEN v.choice='no'  THEN 1 ELSE 0 END) AS no
       FROM pets p
       LEFT JOIN votes v ON v.pet_id = p.id
       GROUP BY p.id
       HAVING yes + no >= 1
       ORDER BY 1.0 * yes / MAX(yes + no, 1) DESC, yes DESC
       LIMIT 5`,
    )
    .all();

  return NextResponse.json({
    totals,
    per_species: perSpecies,
    recent_voters: recentVoters,
    top_loved: topLoved,
  });
}
