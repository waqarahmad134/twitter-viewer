import { NextResponse } from "next/server";
import { forbidIfManager, requireAdminSession } from "@/server/auth";
import { query } from "@/server/db/mysql";

function toBoolean(v) {
  if (typeof v === "boolean") return v;
  if (v == null) return false;
  const s = String(v).toLowerCase().trim();
  return s === "1" || s === "true" || s === "yes" || s === "on";
}

function parseSchemaJson(raw) {
  const s = raw == null ? "" : String(raw).trim();
  if (!s) return { ok: false, error: "Schema JSON is required" };
  try {
    const parsed = JSON.parse(s);
    return { ok: true, parsed, stringified: JSON.stringify(parsed) };
  } catch (e) {
    return { ok: false, error: `Invalid JSON: ${e?.message || "parse error"}` };
  }
}

function mapRow(r) {
  let parsed = null;
  try {
    parsed = r.schema_json ? JSON.parse(r.schema_json) : null;
  } catch {
    parsed = null;
  }
  return {
    id: r.id,
    name: r.name,
    schemaJson: r.schema_json ?? "",
    parsed,
    isActive: Boolean(r.is_active),
    sortOrder: Number(r.sort_order) || 0,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export async function GET(_request, context) {
  const { session, denied } = await requireAdminSession();
  if (denied) return denied;
  const fm = forbidIfManager(session);
  if (fm) return fm;

  const params = await context.params;
  try {
    const id = Number.parseInt(String(params.id), 10);
    if (!Number.isFinite(id))
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });

    const rows = await query(
      `SELECT id, name, schema_json, is_active, sort_order, created_at, updated_at
       FROM site_schemas WHERE id = ? LIMIT 1`,
      [id]
    );
    const row = rows[0];
    if (!row)
      return NextResponse.json({ error: "Schema not found" }, { status: 404 });

    return NextResponse.json({ schema: mapRow(row) });
  } catch (err) {
    console.error("Admin site-schema get error:", err.message);
    return NextResponse.json({ error: "Failed to fetch schema" }, { status: 500 });
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
    const nameParam =
      body.name != null ? String(body.name).trim() || "Schema" : null;
    const parsed = parseSchemaJson(body.schemaJson ?? body.schema_json);
    if (!parsed.ok)
      return NextResponse.json({ error: parsed.error }, { status: 400 });

    const isActive = toBoolean(body.isActive ?? body.is_active) ? 1 : 0;
    const sortOrder = Number.parseInt(
      String(body.sortOrder ?? body.sort_order ?? 0),
      10
    );
    const order = Number.isFinite(sortOrder) ? sortOrder : 0;

    const result = await query(
      `UPDATE site_schemas SET
         name = COALESCE(?, name),
         schema_json = ?,
         is_active = ?,
         sort_order = ?
       WHERE id = ?`,
      [nameParam, parsed.stringified, isActive, order, id]
    );

    if (!result.affectedRows) {
      return NextResponse.json({ error: "Schema not found" }, { status: 404 });
    }

    const rows = await query(
      `SELECT id, name, schema_json, is_active, sort_order, created_at, updated_at
       FROM site_schemas WHERE id = ? LIMIT 1`,
      [id]
    );
    return NextResponse.json({ schema: mapRow(rows[0]) });
  } catch (err) {
    console.error("Admin site-schema update error:", err.message);
    return NextResponse.json({ error: "Failed to update schema" }, { status: 500 });
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

    const result = await query(`DELETE FROM site_schemas WHERE id = ?`, [id]);
    if (!result.affectedRows) {
      return NextResponse.json({ error: "Schema not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Admin site-schema delete error:", err.message);
    return NextResponse.json({ error: "Failed to delete schema" }, { status: 500 });
  }
}
