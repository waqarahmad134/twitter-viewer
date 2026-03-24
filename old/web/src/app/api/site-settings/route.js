import { NextResponse } from "next/server";
import { getSingletonSiteSettingsRow } from "@/server/lib/siteSettingsSingleton";

function mapRow(r) {
  return {
    id: r.id,
    siteName: r.site_name,
    defaultDescription: r.default_description,
    defaultOgImageUrl: r.default_og_image_url,
    defaultOgTitle: r.default_og_title,
    defaultCanonicalBase: r.default_canonical_base,
    defaultNoindex: Boolean(r.default_noindex),
    defaultTwitterCard: r.default_twitter_card,
    defaultTwitterSite: r.default_twitter_site,
    defaultTwitterCreator: r.default_twitter_creator,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export async function GET() {
  try {
    const row = await getSingletonSiteSettingsRow();
    if (!row) {
      return NextResponse.json({
        siteSettings: {
          id: null,
          siteName: "Twitter Viewer",
          defaultDescription: null,
          defaultOgImageUrl: null,
          defaultOgTitle: null,
          defaultCanonicalBase: null,
          defaultNoindex: false,
          defaultTwitterCard: "summary_large_image",
          defaultTwitterSite: null,
          defaultTwitterCreator: null,
        },
      });
    }
    return NextResponse.json({ siteSettings: mapRow(row) });
  } catch (err) {
    console.error("Site settings read failed:", err.message);
    return NextResponse.json(
      { error: "Failed to load site settings" },
      { status: 500 }
    );
  }
}
