import { NextResponse } from "next/server";
import { forbidIfManager, requireAdminSession } from "@/server/auth";
import { query } from "@/server/db/mysql";
import {
  dedupeSiteSettingsRows,
  getSingletonSiteSettingsRow,
} from "@/server/lib/siteSettingsSingleton";

function pickBody(body) {
  return {
    siteName: body?.siteName ?? body?.site_name ?? "Twitter Viewer",
    defaultDescription:
      body?.defaultDescription ?? body?.default_description ?? null,
    defaultOgImageUrl:
      body?.defaultOgImageUrl ?? body?.default_og_image_url ?? null,
    defaultOgTitle: body?.defaultOgTitle ?? body?.default_og_title ?? null,
    defaultCanonicalBase:
      body?.defaultCanonicalBase ?? body?.default_canonical_base ?? null,
    defaultNoindex: Boolean(body?.defaultNoindex ?? body?.default_noindex),
    defaultTwitterCard:
      body?.defaultTwitterCard ?? body?.default_twitter_card ?? null,
    defaultTwitterSite:
      body?.defaultTwitterSite ?? body?.default_twitter_site ?? null,
    defaultTwitterCreator:
      body?.defaultTwitterCreator ?? body?.default_twitter_creator ?? null,
  };
}

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
  const { session, denied } = await requireAdminSession();
  if (denied) return denied;
  const fm = forbidIfManager(session);
  if (fm) return fm;

  try {
    await dedupeSiteSettingsRows();
    const row = await getSingletonSiteSettingsRow();
    if (!row) {
      return NextResponse.json({
        siteSettings: {
          id: null,
          siteName: "Twitter Viewer",
          defaultTitle: null,
          defaultDescription: null,
          defaultOgImageUrl: null,
          defaultOgTitle: null,
          defaultCanonicalBase: null,
          defaultRobots: "index,follow",
          defaultNoindex: false,
          defaultTwitterCard: "summary_large_image",
          defaultTwitterSite: null,
          defaultTwitterCreator: null,
        },
      });
    }
    return NextResponse.json({ siteSettings: mapRow(row) });
  } catch (err) {
    console.error("Admin get site settings failed:", err.message);
    return NextResponse.json(
      { error: "Failed to load site settings" },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  const { session, denied } = await requireAdminSession();
  if (denied) return denied;
  const fm = forbidIfManager(session);
  if (fm) return fm;

  try {
    const body = await request.json().catch(() => ({}));
    const b = pickBody(body);

    await dedupeSiteSettingsRows();
    const existing = await getSingletonSiteSettingsRow();
    const existingId = existing?.id ?? null;

    const values = [
      b.siteName,
      b.defaultDescription,
      b.defaultOgImageUrl,
      b.defaultOgTitle,
      b.defaultCanonicalBase,
      b.defaultNoindex ? 1 : 0,
      b.defaultTwitterCard,
      b.defaultTwitterSite,
      b.defaultTwitterCreator,
    ];

    if (existingId != null) {
      await query(
        `UPDATE site_settings
         SET site_name = ?,
             default_description = ?,
             default_og_image_url = ?,
             default_og_title = ?,
             default_canonical_base = ?,
             default_noindex = ?,
             default_twitter_card = ?,
             default_twitter_site = ?,
             default_twitter_creator = ?
         WHERE id = ?
         LIMIT 1`,
        [...values, existingId]
      );
    } else {
      await query(
        `INSERT INTO site_settings
          (site_name, default_description, default_og_image_url, default_og_title, default_canonical_base, default_noindex, default_twitter_card, default_twitter_site, default_twitter_creator)
         VALUES
          (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        values
      );
    }

    await dedupeSiteSettingsRows();
    const row = await getSingletonSiteSettingsRow();
    return NextResponse.json({
      ok: true,
      siteSettings: mapRow(row),
    });
  } catch (err) {
    console.error("Admin update site settings failed:", err.message);
    return NextResponse.json(
      { error: "Failed to update site settings" },
      { status: 500 }
    );
  }
}
