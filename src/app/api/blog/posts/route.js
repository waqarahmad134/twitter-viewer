import { NextResponse } from "next/server";
import { query } from "@/server/db/mysql";

function parseIntSafe(value, fallback) {
  const n = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeSlug(slug) {
  if (!slug || typeof slug !== "string") return null;
  const s = slug.trim().toLowerCase();
  if (!s) return null;
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s)) return null;
  return s;
}

function getLimit(searchParams) {
  const limit = parseIntSafe(searchParams.get("limit"), 10);
  return Math.max(1, Math.min(50, limit));
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = getLimit(searchParams);
    const categorySlug = normalizeSlug(searchParams.get("categorySlug"));
    const cursor =
      searchParams.get("cursor") != null
        ? String(searchParams.get("cursor")).trim()
        : null;

    const cursorId = cursor && /^\d+$/.test(cursor) ? Number(cursor) : null;

    const params = [];
    let cursorClause = "";
    if (cursorId != null) {
      cursorClause = "AND p.id < ?";
      params.push(cursorId);
    }

    const sql = `
      SELECT
        p.id,
        p.slug,
        p.title,
        p.excerpt,
        p.cover_image_url,
        p.published_at,
        p.updated_at,
        p.seo_title,
        p.seo_description,
        p.og_image_url,
        p.noindex,
        c.slug AS category_slug,
        c.name AS category_name
      FROM posts p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.status = 'published'
        ${cursorClause}
        ${categorySlug ? "AND c.slug = ?" : ""}
      ORDER BY p.published_at DESC, p.id DESC
      LIMIT ?
    `;

    if (categorySlug) params.push(categorySlug);
    params.push(limit);

    const rows = await query(sql, params);

    const posts = rows.map((p) => ({
      id: p.id,
      slug: p.slug,
      title: p.title,
      excerpt: p.excerpt,
      coverImageUrl: p.cover_image_url,
      publishedAt: p.published_at,
      updatedAt: p.updated_at,
      seo: {
        title: p.seo_title ?? null,
        description: p.seo_description ?? null,
        ogImageUrl: p.og_image_url ?? null,
        noindex: Boolean(p.noindex),
      },
      category: p.category_slug
        ? { slug: p.category_slug, name: p.category_name }
        : null,
    }));

    const nextCursor =
      posts.length === limit ? posts[posts.length - 1].id : null;

    return NextResponse.json({ posts, nextCursor });
  } catch (err) {
    console.error("Blog posts list error:", err.message);
    return NextResponse.json(
      { error: "Failed to fetch blog posts" },
      { status: 500 }
    );
  }
}
