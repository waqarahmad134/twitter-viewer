import { notFound } from "next/navigation";
import Link from "next/link";
import { apiGetJson } from "@/lib/api";
import { normalizeBaseUrl } from "@/lib/siteSettings";
import { resolveMediaUrl } from "@/lib/mediaUrl";

export const dynamic = "force-dynamic";

const RELATED_MAX = 4;

/** Same category first, then recent posts; excludes current slug. */
async function getRelatedPosts(current) {
  const seen = new Set([current.slug]);
  const out = [];

  function pushUnique(list) {
    for (const p of list) {
      if (out.length >= RELATED_MAX) return;
      if (!p?.slug || seen.has(p.slug)) continue;
      seen.add(p.slug);
      out.push(p);
    }
  }

  try {
    if (current.category?.slug) {
      const qs = new URLSearchParams({
        categorySlug: current.category.slug,
        limit: "50",
      });
      const data = await apiGetJson(`/api/blog/posts?${qs.toString()}`);
      pushUnique(data.posts || []);
    }
  } catch {
    // ignore
  }

  if (out.length < RELATED_MAX) {
    try {
      const data = await apiGetJson(`/api/blog/posts?limit=50`);
      pushUnique(data.posts || []);
    } catch {
      // ignore
    }
  }

  return out.slice(0, RELATED_MAX);
}

function buildJsonLd({ post, canonicalUrl, siteSettings }) {
  const description = post.seo?.description || post.excerpt || "";
  const ogImageRaw =
    post.seo?.ogImageUrl ||
    post.coverImageUrl ||
    siteSettings?.defaultOgImageUrl ||
    undefined;
  const ogImage = ogImageRaw ? resolveMediaUrl(ogImageRaw, { absolute: true }) : undefined;
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description,
    image: ogImage,
    datePublished: post.publishedAt || undefined,
    dateModified: post.updatedAt || undefined,
    url: canonicalUrl,
    inLanguage: "en",
  };
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  let post;
  try {
    post = await apiGetJson(`/api/blog/posts/${slug}`);
  } catch {
    return {
      title: "Blog | Twitter Viewer",
      description: "Post not found.",
    };
  }

  let siteSettings = null;
  try {
    siteSettings = (await apiGetJson("/api/site-settings"))?.siteSettings || null;
  } catch {
    // ignore
  }

  const baseUrl = normalizeBaseUrl(
    siteSettings?.defaultCanonicalBase ||
      process.env.NEXT_PUBLIC_BASE_URL ||
      process.env.BASE_URL
  );
  const canonicalUrl = `${baseUrl}/blog/${post.slug}`;

  const seoTitle = post.seo?.title || post.title;
  const seoDescription = post.seo?.description || post.excerpt;
  const postNoindex = Boolean(post.seo?.noindex);
  const siteNoindex = Boolean(siteSettings?.defaultNoindex);

  const noindex = postNoindex || siteNoindex;

  const ogImageRaw =
    post.seo?.ogImageUrl ||
    post.coverImageUrl ||
    siteSettings?.defaultOgImageUrl ||
    undefined;
  const ogImage = ogImageRaw ? resolveMediaUrl(ogImageRaw, { absolute: true }) : undefined;

  const twitterCard = siteSettings?.defaultTwitterCard || "summary_large_image";
  const twitterSite = siteSettings?.defaultTwitterSite || undefined;
  const twitterCreator = siteSettings?.defaultTwitterCreator || undefined;

  return {
    title: seoTitle,
    description: seoDescription,
    alternates: { canonical: canonicalUrl },
    robots: noindex
      ? { index: false, follow: false }
      : { index: true, follow: true },
    openGraph: {
      type: "article",
      title: seoTitle,
      description: seoDescription,
      url: canonicalUrl,
      publishedTime: post.publishedAt || undefined,
      modifiedTime: post.updatedAt || undefined,
      images: ogImage ? [ogImage] : undefined,
    },
    twitter: {
      card: twitterCard,
      site: twitterSite,
      creator: twitterCreator,
      title: seoTitle,
      description: seoDescription,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}

export default async function BlogPostPage({ params }) {
  const { slug } = await params;
  let post;
  try {
    post = await apiGetJson(`/api/blog/posts/${slug}`);
  } catch {
    notFound();
  }

  let siteSettings = null;
  try {
    siteSettings = (await apiGetJson("/api/site-settings"))?.siteSettings || null;
  } catch {
    // ignore
  }

  const baseUrl = normalizeBaseUrl(
    siteSettings?.defaultCanonicalBase ||
      process.env.NEXT_PUBLIC_BASE_URL ||
      process.env.BASE_URL
  );
  const canonicalUrl = `${baseUrl}/blog/${post.slug}`;

  if (!post) notFound();

  const relatedPosts = await getRelatedPosts(post);

  const jsonLd = buildJsonLd({ post, canonicalUrl, siteSettings });
  const title = post.title;
  const contentHtml = post.contentHtml;
  const contentMd = post.contentMd;

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <article>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-zinc-600">
          {post.category?.slug ? (
            <Link
              href={`/blog?categorySlug=${post.category.slug}`}
              className="hover:underline"
            >
              {post.category.name}
            </Link>
          ) : null}
          <span>
            Published:{" "}
            {post.publishedAt
              ? new Date(post.publishedAt).toLocaleDateString()
              : "Missing"}
          </span>
          <span>
            Modified:{" "}
            {post.updatedAt
              ? new Date(post.updatedAt).toLocaleDateString()
              : "Missing"}
          </span>
        </div>

        <h1 className="mt-3 text-3xl sm:text-4xl font-semibold">{title}</h1>
        {post.excerpt ? (
          <p className="mt-3 text-zinc-600">{post.excerpt}</p>
        ) : null}

        {/* JSON-LD for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />

        {post.coverImageUrl ? (
          <div className="mt-6">
            <figure className="m-0">
              <img
                src={resolveMediaUrl(post.coverImageUrl)}
                alt={post.coverAltText || post.title}
                className="w-full rounded-xl border border-zinc-200"
              />
              {post.coverCaption ? (
                <figcaption className="mt-2 text-sm text-zinc-600">
                  {post.coverCaption}
                </figcaption>
              ) : null}
            </figure>
          </div>
        ) : null}

        <div className="mt-7 prose prose-zinc max-w-none">
          {contentHtml ? (
            <div
              dangerouslySetInnerHTML={{ __html: contentHtml }}
            />
          ) : contentMd ? (
            <pre className="whitespace-pre-wrap rounded-lg bg-zinc-50 border border-zinc-200 p-4 text-sm text-zinc-800">
              {contentMd}
            </pre>
          ) : (
            <div className="text-zinc-600">Content coming soon.</div>
          )}
        </div>

        {relatedPosts.length > 0 ? (
          <section className="mt-12 pt-10 border-t border-zinc-200" aria-labelledby="related-heading">
            <h2 id="related-heading" className="text-lg font-semibold text-zinc-900">
              Related posts
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              {post.category?.name
                ? `More in ${post.category.name} and recent articles.`
                : "More from the blog."}
            </p>
            <ul className="mt-6 grid gap-4 sm:grid-cols-2">
              {relatedPosts.map((rp) => (
                <li key={rp.id}>
                  <Link
                    href={`/blog/${rp.slug}`}
                    className="group flex gap-3 rounded-xl border border-zinc-200 bg-zinc-50/80 p-3 transition-colors hover:border-zinc-300 hover:bg-white"
                  >
                    {rp.coverImageUrl ? (
                      <div className="shrink-0 w-20 h-20 rounded-lg overflow-hidden border border-zinc-200 bg-white">
                        <img
                          src={resolveMediaUrl(rp.coverImageUrl)}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="shrink-0 w-20 h-20 rounded-lg border border-dashed border-zinc-200 bg-white" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-zinc-900 group-hover:text-x-blue line-clamp-2">
                        {rp.title}
                      </div>
                      {rp.excerpt ? (
                        <p className="mt-1 text-sm text-zinc-600 line-clamp-2">{rp.excerpt}</p>
                      ) : null}
                      {rp.publishedAt ? (
                        <div className="mt-2 text-xs text-zinc-500">
                          {new Date(rp.publishedAt).toLocaleDateString()}
                        </div>
                      ) : null}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <div className="mt-10 text-sm text-zinc-600">
          <Link href="/blog" className="hover:underline">
            Back to blog
          </Link>
        </div>
      </article>
    </div>
  );
}

