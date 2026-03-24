import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { forbidIfManager, requireAdminSession } from "@/server/auth";
import { isDatabaseConnectionError, query } from "@/server/db/mysql";

function mapRow(r) {
  return {
    id: r.id,
    email: r.email,
    role: r.role,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function toCount(n) {
  const v = Number(n);
  return Number.isFinite(v) ? v : 0;
}

export async function PUT(request, context) {
  const { session, denied } = await requireAdminSession();
  if (denied) return denied;
  const fm = forbidIfManager(session);
  if (fm) return fm;

  const params = await context.params;
  try {
    const id = Number(params.id);
    if (!Number.isFinite(id))
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });

    const selfId = session.admin.id;
    const existing = await query(
      `SELECT id, email, role FROM admins WHERE id = ? LIMIT 1`,
      [id]
    );
    if (!existing.length)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    const target = existing[0];

    const body = await request.json().catch(() => ({}));
    let role =
      body?.role !== undefined
        ? String(body.role).toLowerCase()
        : String(target.role).toLowerCase();
    if (role !== "admin" && role !== "manager") {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    if (String(target.role).toLowerCase() === "admin" && role === "manager") {
      const cntRows = await query(
        `SELECT COUNT(*) AS c FROM admins WHERE LOWER(role) = 'admin' AND id != ?`,
        [id]
      );
      if (toCount(cntRows[0]?.c) < 1) {
        return NextResponse.json(
          { error: "Must keep at least one administrator account" },
          { status: 400 }
        );
      }
    }

    if (
      selfId === id &&
      String(target.role).toLowerCase() === "admin" &&
      role === "manager"
    ) {
      const cntRows = await query(
        `SELECT COUNT(*) AS c FROM admins WHERE LOWER(role) = 'admin' AND id != ?`,
        [id]
      );
      if (toCount(cntRows[0]?.c) < 1) {
        return NextResponse.json(
          { error: "Cannot demote yourself: you are the only administrator" },
          { status: 400 }
        );
      }
    }

    const newPassword = body?.password;
    const pwdStr =
      newPassword === undefined || newPassword === null
        ? ""
        : String(newPassword);
    if (pwdStr.length > 0) {
      if (pwdStr.length < 8) {
        return NextResponse.json(
          { error: "Password must be at least 8 characters" },
          { status: 400 }
        );
      }
      const hash = await bcrypt.hash(pwdStr, 10);
      await query(
        `UPDATE admins SET role = ?, password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [role, hash, id]
      );
    } else {
      await query(
        `UPDATE admins SET role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [role, id]
      );
    }

    const updated = await query(
      `SELECT id, email, role, created_at, updated_at FROM admins WHERE id = ? LIMIT 1`,
      [id]
    );
    return NextResponse.json({ admin: mapRow(updated[0]) });
  } catch (e) {
    if (isDatabaseConnectionError(e)) {
      return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
    }
    console.error("Update admin:", e);
    return NextResponse.json({ error: "Failed to update admin" }, { status: 500 });
  }
}

export async function DELETE(_request, context) {
  const { session, denied } = await requireAdminSession();
  if (denied) return denied;
  const fm = forbidIfManager(session);
  if (fm) return fm;

  const params = await context.params;
  try {
    const id = Number(params.id);
    if (!Number.isFinite(id))
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    if (id === session.admin.id) {
      return NextResponse.json(
        { error: "You cannot delete your own account" },
        { status: 400 }
      );
    }

    const rows = await query(`SELECT id, role FROM admins WHERE id = ? LIMIT 1`, [
      id,
    ]);
    if (!rows.length)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    const target = rows[0];

    if (String(target.role).toLowerCase() === "admin") {
      const cntRows = await query(
        `SELECT COUNT(*) AS c FROM admins WHERE LOWER(role) = 'admin'`
      );
      if (toCount(cntRows[0]?.c) <= 1) {
        return NextResponse.json(
          { error: "Cannot delete the only administrator" },
          { status: 400 }
        );
      }
    }

    await query(`DELETE FROM admins WHERE id = ?`, [id]);
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (isDatabaseConnectionError(e)) {
      return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
    }
    console.error("Delete admin:", e);
    return NextResponse.json({ error: "Failed to delete admin" }, { status: 500 });
  }
}
