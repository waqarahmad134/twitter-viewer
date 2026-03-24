import { NextResponse } from "next/server";
import { forbidIfManager, requireAdminSession } from "@/server/auth";
import { generateMysqlDumpSql } from "@/server/services/mysqlDumpSql";

export async function GET() {
  const { session, denied } = await requireAdminSession();
  if (denied) return denied;
  const fm = forbidIfManager(session);
  if (fm) return fm;

  try {
    const sql = await generateMysqlDumpSql();
    const dbName = String(process.env.DB_NAME || "twitter").replace(
      /[^a-zA-Z0-9_-]/g,
      "_"
    );
    const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const filename = `${dbName}-backup-${ts}.sql`;

    return new Response(sql, {
      status: 200,
      headers: {
        "Content-Type": "application/sql; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
      },
    });
  } catch (err) {
    console.error("Database backup failed:", err);
    const message = err?.message || "Backup failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
