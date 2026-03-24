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
    const file = formData.get("file");
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }
    if (!file.type?.startsWith("image/")) {
      return NextResponse.json(
        { error: "Only image uploads are allowed" },
        { status: 400 }
      );
    }
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 400 });
    }

    const uploadsDir = ensureUploadsDir();
    const filename = safeImageFilename(file.name);
    const buf = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(path.join(uploadsDir, filename), buf);

    const url = `/uploads/${filename}`;

    try {
      const result = await query(
        `INSERT INTO media (file_url, file_name, mime_type, file_size)
         VALUES (?, ?, ?, ?)`,
        [url, file.name || null, file.type || null, file.size || null]
      );
      return NextResponse.json({ url, mediaId: result.insertId });
    } catch {
      return NextResponse.json({ url, mediaId: null });
    }
  } catch (err) {
    console.error("Upload error:", err?.message || err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
