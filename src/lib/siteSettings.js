import { cache } from "react";
import { apiGetJson } from "./api";

/**
 * Single cached fetch for site settings (used by (site) layout metadata + JSON-LD).
 */
export const getSiteSettings = cache(async () => {
  try {
    const data = await apiGetJson("/api/site-settings");
    return data?.siteSettings ?? null;
  } catch {
    return null;
  }
});

export function normalizeBaseUrl(input) {
  const fallback = "http://localhost:3000";
  const raw = String(input || "").trim();
  if (!raw) return fallback;
  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    const u = new URL(withProtocol);
    return u.origin;
  } catch {
    return fallback;
  }
}

/** Public site origin for sitemap/robots (env + optional DB canonical from getSiteSettings). */
export function getSiteOriginFromSettings(siteSettings) {
  return normalizeBaseUrl(
    siteSettings?.defaultCanonicalBase ||
      process.env.NEXT_PUBLIC_BASE_URL ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      ""
  );
}

/** Homepage `<title>`: derived from site name (SEO strings come from Next metadata / OG title). */
export function buildSiteSeoTitle(siteSettings) {
  const fallback = "Twitter Viewer ";
  const siteName = siteSettings?.siteName?.trim();
  if (siteName) return `${siteName}`;

  return fallback;
}
