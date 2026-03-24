import fs from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { requireAdminSession } from "@/server/auth";
import { query } from "@/server/db/mysql";
import { ensureUploadsDir, safeImageFilename } from "@/server/uploads";

export async function POST(request) {
  const { denied } = await requireAdminSession();
  if (denied) return denied;

  try {
    const formData = await request.formData();
    const files = formData.getAll("files").filter((f) => f instanceof File);
    if (!files.length) {
      return NextResponse.json({ error: "No files uploaded" }, { status: 400 });
    }

    const uploadsDir = ensureUploadsDir();
    const created = [];

    for (const file of files.slice(0, 20)) {
      if (!file.type?.startsWith("image/")) {
        return NextResponse.json(
          { error: "Only image uploads are allowed" },
          { status: 400 }
        );
      }
      if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json(
          { error: "A file exceeds 10MB" },
          { status: 400 }
        );
      }
      const filename = safeImageFilename(file.name);
      const buf = Buffer.from(await file.arrayBuffer());
      await fs.writeFile(path.join(uploadsDir, filename), buf);
      const url = `/uploads/${filename}`;
      const result = await query(
        `INSERT INTO media (file_url, file_name, mime_type, file_size)
         VALUES (?, ?, ?, ?)`,
        [url, file.name || null, file.type || null, file.size || null]
      );
      created.push({ mediaId: result.insertId, url });
    }

    return NextResponse.json({ ok: true, created });
  } catch (err) {
    console.error("Media upload error:", err.message);
    return NextResponse.json({ error: "Media upload failed" }, { status: 500 });
  }
}
