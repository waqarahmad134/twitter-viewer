import { NextResponse } from "next/server";
import { requireAdminSession } from "@/server/auth";
import { query } from "@/server/db/mysql";

function toInt(value) {
  const n = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(n) ? n : null;
}

function mapDbRowToMedia(r) {
  return {
    id: r.id,
    fileUrl: r.file_url,
    fileName: r.file_name,
    mimeType: r.mime_type,
    fileSize: r.file_size,
    title: r.title,
    altText: r.alt_text,
    caption: r.caption,
    description: r.description,
    status: r.status,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export async function GET(request) {
  const { denied } = await requireAdminSession();
  if (denied) return denied;

  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.max(
      1,
      Math.min(60, Number.parseInt(searchParams.get("limit") || "24", 10))
    );
    const cursorId = searchParams.get("cursor")
      ? toInt(searchParams.get("cursor"))
      : null;

    const params = [];
    let cursorClause = "";
    if (cursorId != null) {
      cursorClause = "AND m.id < ?";
      params.push(cursorId);
    }

    const sql = `
      SELECT
        m.*
      FROM media m
      WHERE 1=1
        ${cursorClause}
      ORDER BY m.created_at DESC, m.id DESC
      LIMIT ?
    `;
    params.push(limit);

    const rows = await query(sql, params);
    return NextResponse.json({
      media: rows.map(mapDbRowToMedia),
      nextCursor: rows.length === limit ? rows[rows.length - 1].id : null,
    });
  } catch (err) {
    console.error("Media list error:", err.message);
    return NextResponse.json({ error: "Failed to load media" }, { status: 500 });
  }
}
