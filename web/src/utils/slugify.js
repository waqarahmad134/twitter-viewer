/**
 * URL slug for posts: "How to do" → "how-to-do"
 * (matches server admin/posts slug rules)
 */
export function slugifyPostSlug(input) {
  return String(input || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
