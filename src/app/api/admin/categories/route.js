import { NextResponse } from "next/server";
import { forbidIfManager, requireAdminSession } from "@/server/auth";
import { query } from "@/server/db/mysql";

const ALLOWED_SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
function normalizeSlug(slug) {
  if (slug == null) return null;
  const s = String(slug).trim().toLowerCase();
  if (!s) return null;
  if (!ALLOWED_SLUG_RE.test(s)) return null;
  return s;
}

function toBoolean(v) {
  if (typeof v === "boolean") return v;
  if (v == null) return false;
  const s = String(v).toLowerCase().trim();
  return s === "1" || s === "true" || s === "yes" || s === "on";
}

export async function GET() {
  const { denied } = await requireAdminSession();
  if (denied) return denied;
  try {
    const rows = await query(
      `SELECT id, slug, name, description, seo_title, seo_description, og_image_url, noindex FROM categories ORDER BY name ASC`
    );

    return NextResponse.json({
      categories: rows.map((c) => ({
        id: c.id,
        slug: c.slug,
        name: c.name,
        description: c.description ?? null,
        seoTitle: c.seo_title ?? null,
        seoDescription: c.seo_description ?? null,
        ogImageUrl: c.og_image_url ?? null,
        noIndex: Boolean(c.noindex),
      })),
    });
  } catch (err) {
    console.error("Admin categories list error:", err.message);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  const { session, denied } = await requireAdminSession();
  if (denied) return denied;
  const fm = forbidIfManager(session);
  if (fm) return fm;

  try {
    const body = await request.json().catch(() => ({}));
    const slug = normalizeSlug(body.slug);
    const name = body.name ? String(body.name).trim() : "";
    if (!slug || !name)
      return NextResponse.json(
        { error: "slug and name are required" },
        { status: 400 }
      );

    const result = await query(
      `INSERT INTO categories (slug, name, description, seo_title, seo_description, og_image_url, noindex)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        slug,
        name,
        body.description ? String(body.description) : null,
        body.seoTitle ? String(body.seoTitle) : null,
        body.seoDescription ? String(body.seoDescription) : null,
        body.ogImageUrl ? String(body.ogImageUrl) : null,
        toBoolean(body.noIndex) ? 1 : 0,
      ]
    );

    const rows = await query(`SELECT * FROM categories WHERE id = ? LIMIT 1`, [
      result.insertId,
    ]);
    return NextResponse.json({ category: rows[0] }, { status: 201 });
  } catch (err) {
    console.error("Admin create category error:", err.message);
    if (String(err?.code || "").includes("ER_DUP_ENTRY")) {
      return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
    }
    return NextResponse.json(
      { error: "Failed to create category" },
      { status: 500 }
    );
  }
}
