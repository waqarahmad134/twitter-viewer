import { NextResponse } from "next/server";
import { forbidIfManager, requireAdminSession } from "@/server/auth";
import { query } from "@/server/db/mysql";
import {
  normalizeSlug,
  parseDateOrNull,
  sanitizePostHtml,
  slugifyFromTitle,
  toBoolean,
  toIntOrNull,
} from "@/server/logic/adminPostUtils";

export async function GET(_request, context) {
  const { denied } = await requireAdminSession();
  if (denied) return denied;
  const params = await context.params;
  try {
    const id = toIntOrNull(params.id);
    if (!id) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

    const sql = `
      SELECT
        p.*,
        c.slug AS category_slug,
        c.name AS category_name
      FROM posts p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?
      LIMIT 1
    `;
    const rows = await query(sql, [id]);
    const p = rows[0];
    if (!p)
      return NextResponse.json({ error: "Post not found" }, { status: 404 });

    return NextResponse.json({
      post: {
        id: p.id,
        slug: p.slug,
        title: p.title,
        excerpt: p.excerpt,
        contentMd: p.content_md,
        contentHtml: p.content_html,
        coverImageUrl: p.cover_image_url,
        status: p.status,
        categoryId: p.category_id,
        publishedAt: p.published_at,
        seoTitle: p.seo_title,
        seoDescription: p.seo_description,
        ogImageUrl: p.og_image_url,
        noIndex: Boolean(p.noindex),
        category: p.category_slug
          ? { slug: p.category_slug, name: p.category_name }
          : null,
        createdAt: p.created_at,
        updatedAt: p.updated_at,
      },
    });
  } catch (err) {
    console.error("Admin posts get error:", err.message);
    return NextResponse.json({ error: "Failed to fetch post" }, { status: 500 });
  }
}

export async function PUT(request, context) {
  const { session, denied } = await requireAdminSession();
  if (denied) return denied;
  const fm = forbidIfManager(session);
  if (fm) return fm;

  const params = await context.params;
  try {
    const id = toIntOrNull(params.id);
    if (!id) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

    const body = await request.json().catch(() => ({}));
    const title = body.title ? String(body.title).trim() : "";

    let slug = null;
    if (body.slug !== undefined && body.slug !== null) {
      const raw = String(body.slug).trim();
      if (raw === "") {
        slug = slugifyFromTitle(title);
        if (!slug) {
          return NextResponse.json(
            {
              error:
                "Cannot derive slug from title — add a custom slug or a title with letters/numbers",
            },
            { status: 400 }
          );
        }
      } else {
        slug = normalizeSlug(raw);
        if (!slug)
          return NextResponse.json({ error: "Invalid slug format" }, { status: 400 });
      }
    }

    const status = body.status === "published" ? "published" : "draft";
    const categoryId = toIntOrNull(body.categoryId);
    const parsedPublishedAt = parseDateOrNull(body.publishedAt);
    const parsedModifiedAt = parseDateOrNull(body.modifiedAt);

    if (body.publishedAt != null && body.publishedAt !== "" && !parsedPublishedAt) {
      return NextResponse.json(
        { error: "Invalid publishedAt date" },
        { status: 400 }
      );
    }
    if (body.modifiedAt != null && body.modifiedAt !== "" && !parsedModifiedAt) {
      return NextResponse.json(
        { error: "Invalid modifiedAt date" },
        { status: 400 }
      );
    }

    const publishedAt =
      status === "published" ? parsedPublishedAt || new Date() : null;
    const modifiedAt = parsedModifiedAt;

    const contentHtmlProvided = Object.prototype.hasOwnProperty.call(
      body,
      "contentHtml"
    );
    const contentHtml = contentHtmlProvided
      ? sanitizePostHtml(body.contentHtml)
      : null;

    const sql = `
      UPDATE posts
      SET
        slug = COALESCE(?, slug),
        title = COALESCE(NULLIF(?, ''), title),
        excerpt = ?,
        content_md = ?,
        content_html = COALESCE(?, content_html),
        cover_image_url = ?,
        status = ?,
        category_id = ?,
        published_at = ?,
        seo_title = ?,
        seo_description = ?,
        og_image_url = ?,
        noindex = ?,
        updated_at = COALESCE(?, updated_at)
      WHERE id = ?
    `;

    const qparams = [
      slug,
      title,
      body.excerpt ? String(body.excerpt) : null,
      null,
      contentHtml,
      body.coverImageUrl ? String(body.coverImageUrl) : null,
      status,
      categoryId,
      publishedAt,
      body.seoTitle ? String(body.seoTitle) : null,
      body.seoDescription ? String(body.seoDescription) : null,
      body.ogImageUrl ? String(body.ogImageUrl) : null,
      toBoolean(body.noIndex) ? 1 : 0,
      modifiedAt,
      id,
    ];

    const result = await query(sql, qparams);
    if (!result.affectedRows)
      return NextResponse.json({ error: "Post not found" }, { status: 404 });

    const rows = await query(`SELECT * FROM posts WHERE id = ? LIMIT 1`, [id]);
    return NextResponse.json({ post: rows[0] });
  } catch (err) {
    console.error("Admin update post error:", err.message);
    if (String(err?.code || "").includes("ER_DUP_ENTRY")) {
      return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to update post" }, { status: 500 });
  }
}

export async function DELETE(_request, context) {
  const { session, denied } = await requireAdminSession();
  if (denied) return denied;
  const fm = forbidIfManager(session);
  if (fm) return fm;

  const params = await context.params;
  try {
    const id = toIntOrNull(params.id);
    if (!id) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

    const result = await query(`DELETE FROM posts WHERE id = ?`, [id]);
    if (!result.affectedRows)
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Admin delete post error:", err.message);
    return NextResponse.json({ error: "Failed to delete post" }, { status: 500 });
  }
}
