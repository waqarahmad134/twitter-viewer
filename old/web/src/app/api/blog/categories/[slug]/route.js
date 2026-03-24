import { NextResponse } from "next/server";
import { query } from "@/server/db/mysql";

function normalizeSlug(slug) {
  if (!slug || typeof slug !== "string") return null;
  const s = slug.trim().toLowerCase();
  if (!s) return null;
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s)) return null;
  return s;
}

export async function GET(_request, context) {
  const params = await context.params;
  try {
    const slug = normalizeSlug(params.slug);
    if (!slug) {
      return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
    }

    const sql = `
      SELECT id, slug, name, description
      FROM categories
      WHERE slug = ?
      LIMIT 1
    `;
    const rows = await query(sql, [slug]);
    const c = rows[0];
    if (!c)
      return NextResponse.json({ error: "Category not found" }, { status: 404 });

    return NextResponse.json({
      category: {
        id: c.id,
        slug: c.slug,
        name: c.name,
        description: c.description ?? null,
      },
    });
  } catch (err) {
    console.error("Blog category detail error:", err.message);
    return NextResponse.json(
      { error: "Failed to fetch category" },
      { status: 500 }
    );
  }
}
