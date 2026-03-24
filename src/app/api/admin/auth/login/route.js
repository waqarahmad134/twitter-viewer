import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getAdminIronSession } from "@/server/auth";
import { isDatabaseConnectionError, query } from "@/server/db/mysql";

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { email, password } = body || {};

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    if (!normalizedEmail)
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });

    const rows = await query(
      `SELECT id, email, password_hash, role FROM admins WHERE email = ? LIMIT 1`,
      [normalizedEmail]
    );

    const admin = rows[0];
    if (!admin)
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

    const ok = await bcrypt.compare(String(password), admin.password_hash);
    if (!ok)
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

    const session = await getAdminIronSession();
    session.admin = { id: admin.id, email: admin.email, role: admin.role };
    await session.save();

    return NextResponse.json({ ok: true, admin: session.admin });
  } catch (err) {
    if (isDatabaseConnectionError(err)) {
      console.error("Admin login: database unreachable:", err?.code, err?.message);
      return NextResponse.json(
        {
          error:
            "Database is not reachable. Start MySQL and verify web/.env (DB_HOST, DB_PORT). On Windows try DB_HOST=127.0.0.1",
          code: "DB_CONNECTION",
        },
        { status: 503 }
      );
    }
    console.error("Admin login error:", err?.message || err);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
