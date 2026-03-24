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
      SELECT
        p.*,
        c.slug AS category_slug,
        c.name AS category_name,
        md.alt_text AS cover_alt_text,
        md.caption AS cover_caption
      FROM posts p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN media md
        ON md.file_url = p.cover_image_url
       AND md.status = 'active'
      WHERE p.status = 'published' AND p.slug = ?
      LIMIT 1
    `;

    const rows = await query(sql, [slug]);
    const p = rows[0];
    if (!p)
      return NextResponse.json({ error: "Post not found" }, { status: 404 });

    return NextResponse.json({
      id: p.id,
      slug: p.slug,
      title: p.title,
      excerpt: p.excerpt,
      contentHtml: p.content_html ?? null,
      contentMd: p.content_md ?? null,
      coverImageUrl: p.cover_image_url ?? null,
      coverAltText: p.cover_alt_text ?? null,
      coverCaption: p.cover_caption ?? null,
      publishedAt: p.published_at,
      updatedAt: p.updated_at,
      category: p.category_slug
        ? { slug: p.category_slug, name: p.category_name }
        : null,
      seo: {
        title: p.seo_title ?? null,
        description: p.seo_description ?? null,
        ogImageUrl: p.og_image_url ?? null,
        noindex: Boolean(p.noindex),
      },
    });
  } catch (err) {
    console.error("Blog post detail error:", err.message);
    return NextResponse.json(
      { error: "Failed to fetch blog post" },
      { status: 500 }
    );
  }
}
