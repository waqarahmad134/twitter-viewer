import fs from "fs";
import path from "path";

export function getUploadsDir() {
  return path.join(process.cwd(), "uploads");
}

export function ensureUploadsDir() {
  const dir = getUploadsDir();
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export function safeImageFilename(originalName) {
  const safeName = String(originalName || "image").replace(/[^a-zA-Z0-9._-]/g, "_");
  const ext = path.extname(safeName) || "";
  const base = safeName.slice(0, safeName.length - ext.length).slice(0, 80);
  return `${base}-${Date.now()}${ext}`;
}
