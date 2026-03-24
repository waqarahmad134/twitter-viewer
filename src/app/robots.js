import { getSiteSettings, getSiteOriginFromSettings } from "@/lib/siteSettings";

export const dynamic = "force-dynamic";

export default async function robots() {
  const siteSettings = await getSiteSettings();
  const base = getSiteOriginFromSettings(siteSettings);

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
