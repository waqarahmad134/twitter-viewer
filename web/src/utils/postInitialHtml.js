/**
 * Build initial HTML for the rich editor from API post.
 * Prefers `contentHtml`; if only legacy `contentMd` exists, convert to simple safe HTML.
 * @param {{ contentHtml?: string|null, contentMd?: string|null }} post
 * @returns {string}
 */
export function postInitialHtml(post) {
  const html = post?.contentHtml;
  if (html != null && String(html).trim() !== "") return String(html);

  const md = post?.contentMd;
  if (md == null || String(md).trim() === "") return "";

  const esc = (s) =>
    String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  return String(md)
    .split(/\n\s*\n/)
    .map((block) => {
      const t = block.trim();
      if (!t) return "";
      return `<p>${esc(t).replace(/\n/g, "<br/>")}</p>`;
    })
    .join("");
}
