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

export async function GET(request) {
  const { denied } = await requireAdminSession();
  if (denied) return denied;
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.max(
      1,
      Math.min(500, Number.parseInt(searchParams.get("limit") || "100", 10))
    );
    const status = searchParams.get("status")
      ? String(searchParams.get("status"))
      : null;
    const q = searchParams.get("q") ? String(searchParams.get("q")) : null;

    const conditions = [];
    const params = [];

    conditions.push(`1=1`);
    if (status && (status === "draft" || status === "published")) {
      conditions.push(`p.status = ?`);
      params.push(status);
    }
    if (q && q.length >= 2) {
      conditions.push(`(p.title LIKE ? OR p.slug LIKE ?)`);
      params.push(`%${q}%`);
      params.push(`%${q}%`);
    }

    const sql = `
      SELECT
        p.id,
        p.slug,
        p.title,
        p.excerpt,
        p.content_md,
        p.content_html,
        p.cover_image_url,
        p.status,
        p.category_id,
        p.published_at,
        p.seo_title,
        p.seo_description,
        p.og_image_url,
        p.noindex,
        p.created_at,
        p.updated_at,
        c.slug AS category_slug,
        c.name AS category_name
      FROM posts p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE ${conditions.join(" AND ")}
      ORDER BY p.updated_at DESC
      LIMIT ?
    `;
    params.push(limit);

    const rows = await query(sql, params);
    return NextResponse.json({
      posts: rows.map((p) => ({
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
      })),
    });
  } catch (err) {
    console.error("Admin posts list error:", err.message);
    return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 });
  }
}

export async function POST(request) {
  const { session, denied } = await requireAdminSession();
  if (denied) return denied;
  const fm = forbidIfManager(session);
  if (fm) return fm;

  try {
    const body = await request.json().catch(() => ({}));
    const title = body.title ? String(body.title).trim() : "";
    let slug = normalizeSlug(body.slug);
    if (!slug) {
      slug = slugifyFromTitle(title);
    }
    if (!title) {
      return NextResponse.json({ error: "title is required" }, { status: 400 });
    }
    if (!slug) {
      return NextResponse.json(
        {
          error:
            "slug is required (or use a title with letters/numbers so a URL slug can be generated)",
        },
        { status: 400 }
      );
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
    const modifiedAt = parsedModifiedAt || new Date();

    const contentHtml = sanitizePostHtml(body.contentHtml);

    const sql = `
      INSERT INTO posts (
        slug, title, excerpt, content_md, content_html, cover_image_url,
        status, category_id, published_at,
        seo_title, seo_description, og_image_url, noindex, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
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
    ];

    const result = await query(sql, params);
    const insertedId = result.insertId;

    const createdRows = await query(`SELECT * FROM posts WHERE id = ? LIMIT 1`, [
      insertedId,
    ]);
    return NextResponse.json({ post: createdRows[0] }, { status: 201 });
  } catch (err) {
    console.error("Admin create post error:", err.message);
    if (String(err?.code || "").includes("ER_DUP_ENTRY")) {
      return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to create post" }, { status: 500 });
  }
}
