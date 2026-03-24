import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { forbidIfManager, requireAdminSession } from "@/server/auth";
import { isDatabaseConnectionError, query } from "@/server/db/mysql";

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function mapRow(r) {
  return {
    id: r.id,
    email: r.email,
    role: r.role,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export async function GET() {
  const { denied } = await requireAdminSession();
  if (denied) return denied;
  try {
    const rows = await query(
      `SELECT id, email, role, created_at, updated_at FROM admins ORDER BY id ASC`
    );
    return NextResponse.json({ admins: rows.map(mapRow) });
  } catch (e) {
    if (isDatabaseConnectionError(e)) {
      return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
    }
    console.error("List admins:", e);
    return NextResponse.json({ error: "Failed to list admins" }, { status: 500 });
  }
}

export async function POST(request) {
  const { session, denied } = await requireAdminSession();
  if (denied) return denied;
  const fm = forbidIfManager(session);
  if (fm) return fm;

  try {
    const body = await request.json().catch(() => ({}));
    const email = normalizeEmail(body?.email);
    const password = String(body?.password || "");
    let role = String(body?.role || "manager").toLowerCase();
    if (!email) return NextResponse.json({ error: "Email is required" }, { status: 400 });
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }
    if (role !== "admin" && role !== "manager") role = "manager";

    const hash = await bcrypt.hash(password, 10);
    const result = await query(
      `INSERT INTO admins (email, password_hash, role) VALUES (?, ?, ?)`,
      [email, hash, role]
    );
    let insertId = Number(result?.insertId);
    if (!Number.isFinite(insertId) || insertId <= 0) {
      const found = await query(`SELECT id FROM admins WHERE email = ? LIMIT 1`, [
        email,
      ]);
      insertId = Number(found[0]?.id);
    }
    const created = await query(
      `SELECT id, email, role, created_at, updated_at FROM admins WHERE id = ? LIMIT 1`,
      [insertId]
    );
    if (!created.length) {
      return NextResponse.json(
        { error: "Created account but failed to load row" },
        { status: 500 }
      );
    }
    return NextResponse.json({ admin: mapRow(created[0]) }, { status: 201 });
  } catch (e) {
    if (e?.code === "ER_DUP_ENTRY") {
      return NextResponse.json(
        { error: "That email is already registered" },
        { status: 409 }
      );
    }
    if (isDatabaseConnectionError(e)) {
      return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
    }
    console.error("Create admin:", e);
    return NextResponse.json({ error: "Failed to create admin" }, { status: 500 });
  }
}
