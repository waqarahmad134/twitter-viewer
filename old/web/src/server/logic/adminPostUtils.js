import sanitizeHtml from "sanitize-html";

export const ALLOWED_SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function normalizeSlug(slug) {
  if (slug == null) return null;
  const s = String(slug).trim().toLowerCase();
  if (!s) return null;
  if (!ALLOWED_SLUG_RE.test(s)) return null;
  return s;
}

export function slugifyFromTitle(title) {
  const raw = String(title || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return normalizeSlug(raw);
}

export function toIntOrNull(v) {
  if (v == null || v === "") return null;
  const n = Number.parseInt(String(v), 10);
  return Number.isFinite(n) ? n : null;
}

export function toBoolean(v) {
  if (typeof v === "boolean") return v;
  if (v == null) return false;
  const s = String(v).toLowerCase().trim();
  return s === "1" || s === "true" || s === "yes" || s === "on";
}

export function parseDateOrNull(value) {
  if (value == null || value === "") return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

export function sanitizePostHtml(html) {
  if (html == null) return null;
  const value = String(html);
  const cleaned = sanitizeHtml(value, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat([
      "img",
      "h1",
      "h2",
      "h3",
      "pre",
      "code",
    ]),
    allowedAttributes: {
      a: ["href", "name", "target", "rel"],
      img: ["src", "alt", "title", "width", "height"],
      "*": ["class"],
      pre: ["class"],
      code: ["class"],
    },
    allowedSchemes: ["http", "https", "mailto"],
  });
  return cleaned;
}
