import Link from "next/link";
import { apiGetJson } from "@/lib/api";
import { normalizeBaseUrl } from "@/lib/siteSettings";
import { resolveMediaUrl } from "@/lib/mediaUrl";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  let siteSettings = null;
  try {
    siteSettings = (await apiGetJson("/api/site-settings"))?.siteSettings || null;
  } catch {
    // ignore
  }

  const canonicalBase = normalizeBaseUrl(
    siteSettings?.defaultCanonicalBase || process.env.NEXT_PUBLIC_BASE_URL
  );
  const canonicalUrl = `${canonicalBase}/blog`;

  const title =
    siteSettings?.siteName ? `Blog | ${siteSettings.siteName}` : "Blog | Twitter Viewer";
  const description =
    siteSettings?.defaultDescription ||
    "Guides and updates. Blog content is server-rendered for SEO.";

  const noindex = Boolean(siteSettings?.defaultNoindex);

  const ogImg = siteSettings?.defaultOgImageUrl
    ? resolveMediaUrl(siteSettings.defaultOgImageUrl, { absolute: true })
    : undefined;

  return {
    title,
    description,
    metadataBase: new URL(canonicalBase),
    alternates: { canonical: canonicalUrl },
    robots: noindex
      ? { index: false, follow: false }
      : { index: true, follow: true },
    openGraph: {
      type: "website",
      title,
      description,
      url: canonicalUrl,
      images: ogImg ? [ogImg] : undefined,
    },
    twitter: {
      card: siteSettings?.defaultTwitterCard || "summary_large_image",
      site: siteSettings?.defaultTwitterSite || undefined,
      creator: siteSettings?.defaultTwitterCreator || undefined,
      title,
      description,
      images: ogImg ? [ogImg] : undefined,
    },
  };
}

export default async function BlogIndexPage({ searchParams }) {
  const limit = 10;
  let posts = [];
  let nextCursor = null;
  const categorySlug =
    typeof searchParams?.categorySlug === "string"
      ? searchParams.categorySlug
      : "";
  try {
    const params = new URLSearchParams({ limit: String(limit) });
    if (categorySlug.trim()) params.set("categorySlug", categorySlug.trim());
    const data = await apiGetJson(`/api/blog/posts?${params.toString()}`);
    posts = data.posts || [];
    nextCursor = data.nextCursor ?? null;
  } catch {
    // If DB isn't configured yet, render an empty state instead of a hard failure.
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-semibold">Blog</h1>
        <p className="mt-3 text-zinc-600">
          Server-rendered posts with per-post SEO fields (title/description/OG/canonical).
        </p>
      </div>

      {posts.length === 0 ? (
        <div className="text-zinc-600">No posts published yet.</div>
      ) : (
        <div className="grid gap-6">
          {posts.map((p) => (
            <article
              key={p.id}
              className="rounded-xl border border-zinc-200 bg-white p-5 hover:border-zinc-300"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  {p.category?.name ? (
                    <div className="text-sm text-zinc-500">
                      Category: {p.category.name}
                    </div>
                  ) : null}
                  <h2 className="mt-2 text-xl font-semibold">
                    <Link href={`/blog/${p.slug}`} className="hover:underline">
                      {p.title}
                    </Link>
                  </h2>
                  {p.excerpt ? (
                    <p className="mt-2 text-zinc-600">{p.excerpt}</p>
                  ) : null}
                </div>
                <div className="text-xs text-zinc-500 text-right">
                  <div>
                    Published:{" "}
                    {p.publishedAt
                      ? new Date(p.publishedAt).toLocaleDateString()
                      : "Missing"}
                  </div>
                  <div className="mt-1">
                    Modified:{" "}
                    {p.updatedAt
                      ? new Date(p.updatedAt).toLocaleDateString()
                      : "Missing"}
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <Link
                  href={`/blog/${p.slug}`}
                  className="text-sm text-zinc-900 hover:underline"
                >
                  Read more
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Cursor pagination can be added later once admin UI starts publishing posts */}
      {nextCursor ? (
        <div className="mt-8 text-zinc-600 text-sm">
          Next page cursor available: {nextCursor}
        </div>
      ) : null}
    </div>
  );
}

