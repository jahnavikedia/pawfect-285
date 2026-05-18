import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const species = (db
    .prepare("SELECT species, COUNT(*) AS n FROM pets GROUP BY species ORDER BY species")
    .all() as { species: string; n: number }[]);

  const totalPets = (db.prepare("SELECT COUNT(*) AS n FROM pets").get() as { n: number }).n;

  return NextResponse.json({ species, totalPets });
}
