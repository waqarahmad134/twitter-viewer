import { NextResponse } from "next/server";
import { query } from "@/server/db/mysql";

function parseIntSafe(value, fallback) {
  const n = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(n) ? n : fallback;
}

function getLimit(searchParams) {
  const limit = parseIntSafe(searchParams.get("limit"), 10);
  return Math.max(1, Math.min(50, limit));
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = getLimit(searchParams);
    const sql = `
      SELECT id, slug, name, description
      FROM categories
      ORDER BY name ASC
      LIMIT ?
    `;
    const rows = await query(sql, [limit]);
    return NextResponse.json({
      categories: rows.map((c) => ({
        id: c.id,
        slug: c.slug,
        name: c.name,
        description: c.description ?? null,
      })),
    });
  } catch (err) {
    console.error("Blog categories list error:", err.message);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}
