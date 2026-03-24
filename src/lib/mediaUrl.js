/**
 * Uploaded files are served by this Next.js app at `/uploads/...` (see `app/uploads/[[...path]]/route.js`).
 *
 * `{ absolute: true }` — public links (OG, JSON-LD): prefers `NEXT_PUBLIC_BASE_URL`, then browser origin.
 */

function siteOriginFromEnv() {
  const raw =
    (typeof process !== "undefined" && process.env.NEXT_PUBLIC_BASE_URL) || "";
  return String(raw).trim().replace(/\/$/, "");
}

function publicSiteBase() {
  const envBase = siteOriginFromEnv();
  if (envBase) return envBase;
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }
  return "";
}

function encodePathname(pathname) {
  if (!pathname || pathname === "/") return pathname;
  const parts = pathname.split("/");
  return parts.map((seg) => (seg === "" ? "" : encodeURIComponent(seg))).join("/");
}

/**
 * @param {string|null|undefined} path
 * @param {{ absolute?: boolean } | boolean} [opts] — `true` / `{ absolute: true }` = URL for SEO / sharing
 */
export function resolveMediaUrl(path, opts) {
  if (path == null || path === "") return "";
  const p = String(path).trim();
  if (!p) return "";

  const forPublicSite =
    opts === true || (opts && typeof opts === "object" && opts.absolute === true);

  if (/^https?:\/\//i.test(p)) return p;

  const normalized = p.startsWith("/") ? p : `/${p}`;

  if (normalized.startsWith("/uploads/")) {
    const safePath = encodePathname(normalized);
    if (forPublicSite) {
      const site = publicSiteBase();
      if (site) return `${site}${safePath}`;
    }
    if (typeof window !== "undefined" && window.location?.origin) {
      return `${window.location.origin}${safePath}`;
    }
    const base = siteOriginFromEnv();
    if (base) return `${base}${safePath}`;
    return safePath;
  }

  if (forPublicSite) {
    const site = publicSiteBase();
    if (site) return `${site}${encodePathname(normalized)}`;
  }

  return encodePathname(normalized.startsWith("/") ? normalized : `/${normalized}`);
}
