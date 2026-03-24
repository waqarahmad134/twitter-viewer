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

export async function GET(_request, context) {
  const { denied } = await requireAdminSession();
  if (denied) return denied;
  const params = await context.params;
  try {
    const id = Number.parseInt(String(params.id), 10);
    if (!Number.isFinite(id))
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });

    const rows = await query(
      `SELECT id, slug, name, description, seo_title, seo_description, og_image_url, noindex
       FROM categories WHERE id = ? LIMIT 1`,
      [id]
    );
    const c = rows[0];
    if (!c)
      return NextResponse.json({ error: "Category not found" }, { status: 404 });

    return NextResponse.json({
      category: {
        id: c.id,
        slug: c.slug,
        name: c.name,
        description: c.description ?? null,
        seoTitle: c.seo_title ?? null,
        seoDescription: c.seo_description ?? null,
        ogImageUrl: c.og_image_url ?? null,
        noIndex: Boolean(c.noindex),
      },
    });
  } catch (err) {
    console.error("Admin category get error:", err.message);
    return NextResponse.json(
      { error: "Failed to fetch category" },
      { status: 500 }
    );
  }
}

export async function PUT(request, context) {
  const { session, denied } = await requireAdminSession();
  if (denied) return denied;
  const fm = forbidIfManager(session);
  if (fm) return fm;

  const params = await context.params;
  try {
    const id = Number.parseInt(String(params.id), 10);
    if (!Number.isFinite(id))
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });

    const body = await request.json().catch(() => ({}));
    const slug = body.slug != null ? normalizeSlug(body.slug) : null;
    const name = body.name != null ? String(body.name).trim() : "";

    const result = await query(
      `UPDATE categories
       SET
         slug = COALESCE(?, slug),
         name = COALESCE(NULLIF(?, ''), name),
         description = ?,
         seo_title = ?,
         seo_description = ?,
         og_image_url = ?,
         noindex = ?
       WHERE id = ?`,
      [
        slug,
        name,
        body.description ? String(body.description) : null,
        body.seoTitle ? String(body.seoTitle) : null,
        body.seoDescription ? String(body.seoDescription) : null,
        body.ogImageUrl ? String(body.ogImageUrl) : null,
        toBoolean(body.noIndex) ? 1 : 0,
        id,
      ]
    );

    if (!result.affectedRows)
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    const rows = await query(`SELECT * FROM categories WHERE id = ? LIMIT 1`, [
      id,
    ]);
    return NextResponse.json({ category: rows[0] });
  } catch (err) {
    console.error("Admin update category error:", err.message);
    if (String(err?.code || "").includes("ER_DUP_ENTRY")) {
      return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
    }
    return NextResponse.json(
      { error: "Failed to update category" },
      { status: 500 }
    );
  }
}

export async function DELETE(_request, context) {
  const { session, denied } = await requireAdminSession();
  if (denied) return denied;
  const fm = forbidIfManager(session);
  if (fm) return fm;

  const params = await context.params;
  try {
    const id = Number.parseInt(String(params.id), 10);
    if (!Number.isFinite(id))
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });

    const result = await query(`DELETE FROM categories WHERE id = ?`, [id]);
    if (!result.affectedRows)
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Admin delete category error:", err.message);
    return NextResponse.json(
      { error: "Failed to delete category" },
      { status: 500 }
    );
  }
}
