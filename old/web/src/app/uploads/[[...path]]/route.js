import fs from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { getUploadsDir } from "@/server/uploads";

function mimeForFilename(filename) {
  const ext = path.extname(filename).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".gif") return "image/gif";
  if (ext === ".webp") return "image/webp";
  if (ext === ".svg") return "image/svg+xml";
  if (ext === ".ico") return "image/x-icon";
  return "application/octet-stream";
}

export async function GET(_request, context) {
  const params = await context.params;
  const segments = params.path || [];
  if (!segments.length) {
    return new NextResponse("Not found", { status: 404 });
  }

  const base = path.resolve(getUploadsDir());
  const filePath = path.resolve(path.join(base, ...segments));
  if (!filePath.startsWith(base)) {
    return new NextResponse("Not found", { status: 404 });
  }

  try {
    const buf = await fs.readFile(filePath);
    return new NextResponse(buf, {
      headers: {
        "Content-Type": mimeForFilename(filePath),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
