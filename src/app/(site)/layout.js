import Link from "next/link";
import {
  buildSiteSeoTitle,
  getSiteSettings,
  normalizeBaseUrl,
} from "@/lib/siteSettings";
import { getSiteSchemas } from "@/lib/siteSchemas";
import { resolveMediaUrl } from "@/lib/mediaUrl";

export const dynamic = "force-dynamic";

function buildRobotsMeta(siteSettings) {
  const noindex = Boolean(siteSettings?.defaultNoindex);
  return noindex
    ? { index: false, follow: false }
    : { index: true, follow: true };
}

export async function generateMetadata() {
  const siteSettings = await getSiteSettings();

  const title = buildSiteSeoTitle(siteSettings);
  const description =
    siteSettings?.defaultDescription?.trim() ||
    "View Twitter profiles and tweets without an account. Clean, private, ad-free.";

  const canonicalBase =
    siteSettings?.defaultCanonicalBase || process.env.NEXT_PUBLIC_BASE_URL;

  const robots = buildRobotsMeta(siteSettings);

  const ogTitle = siteSettings?.defaultOgTitle?.trim() || title;
  const ogImageRaw = siteSettings?.defaultOgImageUrl || null;
  const ogImage = ogImageRaw ? resolveMediaUrl(ogImageRaw, { absolute: true }) : null;

  const twitterCard = siteSettings?.defaultTwitterCard || "summary_large_image";
  const twitterSite = siteSettings?.defaultTwitterSite || undefined;
  const twitterCreator = siteSettings?.defaultTwitterCreator || undefined;

  const baseUrl = normalizeBaseUrl(canonicalBase);
  const canonicalUrl = `${baseUrl}/`;

  const modifiedIso = siteSettings?.updatedAt
    ? new Date(siteSettings.updatedAt).toISOString()
    : undefined;

  return {
    title,
    description,
    metadataBase: new URL(baseUrl),
    alternates: { canonical: canonicalUrl },
    robots,
    openGraph: {
      type: "website",
      title: ogTitle,
      description,
      url: canonicalUrl,
      images: ogImage ? [ogImage] : undefined,
      ...(modifiedIso ? { modifiedTime: modifiedIso } : {}),
    },
    twitter: {
      card: twitterCard,
      site: twitterSite,
      creator: twitterCreator,
      title: ogTitle,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}

export default async function SiteLayout({ children }) {
  const siteSettings = await getSiteSettings();
  const extraSchemas = await getSiteSchemas();
  const baseUrl = normalizeBaseUrl(
    siteSettings?.defaultCanonicalBase || process.env.NEXT_PUBLIC_BASE_URL
  );
  const siteName = siteSettings?.siteName?.trim() || "Twitter Viewer";
  const modifiedIso = siteSettings?.updatedAt
    ? new Date(siteSettings.updatedAt).toISOString()
    : null;
  const publishedIso = siteSettings?.createdAt
    ? new Date(siteSettings.createdAt).toISOString()
    : modifiedIso;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteName,
    url: `${baseUrl}/`,
    ...(publishedIso ? { datePublished: publishedIso } : {}),
    ...(modifiedIso ? { dateModified: modifiedIso } : {}),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {extraSchemas.map((s) => (
        <script
          key={s.id}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(s.json),
          }}
        />
      ))}
      <div className="min-h-screen flex flex-col">
        <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
            <Link
              href="/"
              className="font-display font-bold text-xl text-x-black hover:text-x-blue transition-colors"
            >
              Twitter Viewer
            </Link>
            <nav className="flex gap-6">
              <Link
                href="/blog"
                className="text-x-gray hover:text-x-blue font-medium transition-colors"
              >
                Blog
              </Link>
              <Link
                href="/admin/login"
                className="text-x-gray hover:text-x-blue font-medium transition-colors"
              >
                Admin
              </Link>
              <Link
                href="/twitter-profile-viewer"
                className="text-x-gray hover:text-x-blue font-medium transition-colors"
              >
                Profile Viewer
              </Link>
              <Link
                href="/twitter-tweet-viewer"
                className="text-x-gray hover:text-x-blue font-medium transition-colors"
              >
                Tweet Viewer
              </Link>
            </nav>
          </div>
        </header>

        <main className="flex-1">{children}</main>

        <footer className="bg-slate-100 border-t border-slate-200 py-8 mt-auto">
          <div className="max-w-6xl mx-auto px-4 text-center text-x-gray text-sm">
            <p>
              Twitter Viewer. Clean, private, ad-free.
            </p>
            <p className="mt-2 text-xs">
              Not affiliated with Twitter (X Corp.). All content belongs to respective owners.
            </p>
          </div>
        </footer>
      </div>
    </>
  );
}
