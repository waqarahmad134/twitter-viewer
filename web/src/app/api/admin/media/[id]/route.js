import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { requireAdminSession } from "@/server/auth";
import { query } from "@/server/db/mysql";
import { getUploadsDir } from "@/server/uploads";

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

export async function PUT(request, context) {
  const { denied } = await requireAdminSession();
  if (denied) return denied;

  const params = await context.params;
  try {
    const id = toInt(params.id);
    if (id == null)
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });

    const body = await request.json().catch(() => ({}));
    const title = body.title ?? null;
    const altText = body.altText ?? body.alt_text ?? null;
    const caption = body.caption ?? null;
    const description = body.description ?? null;

    await query(
      `UPDATE media
       SET title = ?, alt_text = ?, caption = ?, description = ?
       WHERE id = ?`,
      [title, altText, caption, description, id]
    );

    const rows = await query(`SELECT * FROM media WHERE id = ? LIMIT 1`, [id]);
    if (!rows[0])
      return NextResponse.json({ error: "Media not found" }, { status: 404 });
    return NextResponse.json({ media: mapDbRowToMedia(rows[0]) });
  } catch (err) {
    console.error("Media update error:", err.message);
    return NextResponse.json(
      { error: "Failed to update media" },
      { status: 500 }
    );
  }
}

export async function DELETE(_request, context) {
  const { denied } = await requireAdminSession();
  if (denied) return denied;

  const params = await context.params;
  try {
    const id = toInt(params.id);
    if (id == null)
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });

    const rows = await query(`SELECT * FROM media WHERE id = ? LIMIT 1`, [id]);
    const m = rows[0];
    if (!m)
      return NextResponse.json({ error: "Media not found" }, { status: 404 });

    const fileUrl = m.file_url || "";
    const filename = fileUrl.startsWith("/uploads/")
      ? fileUrl.replace("/uploads/", "")
      : "";
    if (filename) {
      const fullPath = path.join(getUploadsDir(), filename);
      try {
        fs.unlinkSync(fullPath);
      } catch {
        // ignore
      }
    }

    await query(`DELETE FROM media WHERE id = ?`, [id]);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Media delete error:", err.message);
    return NextResponse.json(
      { error: "Failed to delete media" },
      { status: 500 }
    );
  }
}
