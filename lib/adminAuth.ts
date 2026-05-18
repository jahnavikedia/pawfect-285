import { NextRequest, NextResponse } from "next/server";

export const DEFAULT_ADMIN_TOKEN = "letmein";

export function adminToken(): string {
  return process.env.ADMIN_TOKEN || DEFAULT_ADMIN_TOKEN;
}

export function requireAdmin(req: NextRequest): NextResponse | null {
  const provided = req.headers.get("x-admin-token") ?? req.nextUrl.searchParams.get("token");
  if (provided !== adminToken()) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return null;
}
