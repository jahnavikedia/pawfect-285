import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

const ACCENTS = [
  "#fde68a", "#bbf7d0", "#fecaca", "#bfdbfe", "#ddd6fe",
  "#fbcfe8", "#fed7aa", "#a7f3d0", "#c7d2fe", "#fef08a",
];

export async function POST(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const b = (body ?? {}) as {
    name?: string;
    species?: string;
    breed?: string;
    age?: string;
    tagline?: string;
    description?: string;
    image_url?: string;
    accent?: string;
  };

  for (const f of ["name", "species", "breed", "age", "tagline", "description"] as const) {
    if (!b[f] || typeof b[f] !== "string" || !b[f]!.trim()) {
      return NextResponse.json({ error: `missing field: ${f}` }, { status: 400 });
    }
  }

  const next = (db.prepare("SELECT COALESCE(MAX(id), 0) + 1 AS n FROM pets").get() as { n: number }).n;

  const accent = b.accent && /^#[0-9a-fA-F]{6}$/.test(b.accent) ? b.accent : ACCENTS[next % ACCENTS.length];
  const imageUrl =
    (b.image_url && /^https?:\/\//.test(b.image_url) && b.image_url) ||
    `https://loremflickr.com/600/600/${encodeURIComponent(b.species!.toLowerCase())}?lock=${next}`;

  db.prepare(
    `INSERT INTO pets (id, name, species, breed, age, tagline, description, image_url, accent)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    next,
    b.name!.trim(),
    b.species!.trim(),
    b.breed!.trim(),
    b.age!.trim(),
    b.tagline!.trim(),
    b.description!.trim(),
    imageUrl,
    accent,
  );

  return NextResponse.json({ ok: true, id: next });
}

export async function DELETE(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const idRaw = req.nextUrl.searchParams.get("id");
  const id = idRaw ? Number.parseInt(idRaw, 10) : NaN;
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: "valid id required" }, { status: 400 });
  }
  const info = db.prepare("DELETE FROM pets WHERE id = ?").run(id);
  return NextResponse.json({ ok: true, removed: info.changes });
}
