import { apiGetJson } from "@/lib/api";
import { getSiteSettings, getSiteOriginFromSettings } from "@/lib/siteSettings";

export const dynamic = "force-dynamic";

/** Public marketing routes (same origin as `(site)` layout). */
const STATIC_PATHS = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/blog", changeFrequency: "daily", priority: 0.9 },
  { path: "/twitter-profile-viewer", changeFrequency: "monthly", priority: 0.8 },
  { path: "/twitter-tweet-viewer", changeFrequency: "monthly", priority: 0.8 },
];

async function fetchAllPublishedPosts() {
  const rows = [];
  let cursor = null;
  const limit = 50;

  for (;;) {
    const qs = new URLSearchParams({ limit: String(limit) });
    if (cursor != null) qs.set("cursor", String(cursor));
    try {
      const data = await apiGetJson(`/api/blog/posts?${qs.toString()}`);
      const posts = data.posts || [];
      for (const p of posts) {
        if (p?.slug) rows.push(p);
      }
      if (!data.nextCursor || posts.length === 0) break;
      cursor = data.nextCursor;
    } catch {
      break;
    }
  }

  return rows;
}

export default async function sitemap() {
  const siteSettings = await getSiteSettings();
  const base = getSiteOriginFromSettings(siteSettings);

  const staticEntries = STATIC_PATHS.map(({ path, changeFrequency, priority }) => ({
    url: `${base}${path}`,
    lastModified: siteSettings?.updatedAt ? new Date(siteSettings.updatedAt) : new Date(),
    changeFrequency,
    priority,
  }));

  let blogEntries = [];
  try {
    const posts = await fetchAllPublishedPosts();
    blogEntries = posts.map((p) => ({
      url: `${base}/blog/${p.slug}`,
      lastModified: p.updatedAt
        ? new Date(p.updatedAt)
        : p.publishedAt
          ? new Date(p.publishedAt)
          : new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    }));
  } catch {
    // API unavailable — still emit static URLs
  }

  return [...staticEntries, ...blogEntries];
}
