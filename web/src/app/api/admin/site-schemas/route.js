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

export async function GET() {
  const { session, denied } = await requireAdminSession();
  if (denied) return denied;
  const fm = forbidIfManager(session);
  if (fm) return fm;

  try {
    const rows = await query(
      `SELECT id, name, schema_json, is_active, sort_order, created_at, updated_at
       FROM site_schemas
       ORDER BY sort_order ASC, id ASC`
    );
    return NextResponse.json({ schemas: rows.map(mapRow) });
  } catch (err) {
    console.error("Admin site-schemas list error:", err.message);
    return NextResponse.json({ error: "Failed to fetch schemas" }, { status: 500 });
  }
}

export async function POST(request) {
  const { session, denied } = await requireAdminSession();
  if (denied) return denied;
  const fm = forbidIfManager(session);
  if (fm) return fm;

  try {
    const body = await request.json().catch(() => ({}));
    const name = body.name != null ? String(body.name).trim() : "";
    const label = name || "Schema";
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
      `INSERT INTO site_schemas (name, schema_json, is_active, sort_order)
       VALUES (?, ?, ?, ?)`,
      [label, parsed.stringified, isActive, order]
    );

    const rows = await query(
      `SELECT id, name, schema_json, is_active, sort_order, created_at, updated_at
       FROM site_schemas WHERE id = ? LIMIT 1`,
      [result.insertId]
    );
    return NextResponse.json({ schema: mapRow(rows[0]) }, { status: 201 });
  } catch (err) {
    console.error("Admin site-schema create error:", err.message);
    return NextResponse.json({ error: "Failed to create schema" }, { status: 500 });
  }
}
