import { NextResponse } from "next/server";
import { query } from "@/server/db/mysql";

export async function GET() {
  try {
    const rows = await query(
      `SELECT id, name, schema_json
       FROM site_schemas
       WHERE is_active = 1
       ORDER BY sort_order ASC, id ASC`
    );

    const schemas = [];
    for (const r of rows) {
      try {
        const json = r.schema_json ? JSON.parse(r.schema_json) : null;
        if (json != null && typeof json === "object") {
          schemas.push({ id: r.id, name: r.name, json });
        }
      } catch {
        // skip invalid rows
      }
    }

    return NextResponse.json({ schemas });
  } catch (err) {
    console.error("Public site-schemas error:", err.message);
    return NextResponse.json(
      { error: "Failed to load schemas", schemas: [] },
      { status: 500 }
    );
  }
}
