"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ImageUploadField from "../../../_components/ImageUploadField";
import PostContentEditor from "../../../_components/PostContentEditor";
import { useAdminToast } from "../../../_components/AdminToastProvider";
import { slugifyPostSlug } from "@/utils/slugify";
import { postInitialHtml } from "@/utils/postInitialHtml";

async function requireAdmin(router) {
  const res = await fetch("/api/admin/auth/me", { credentials: "include" });
  if (!res.ok) router.replace("/admin/login");
}

function toDateTimeLocalValue(input) {
  if (!input) return "";
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const min = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
}

export default function AdminEditPostPage({ params }) {
  const { id: postId } = use(params);
  const router = useRouter();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const toast = useAdminToast();

  const [slug, setSlug] = useState("");
  /** true = keep slug unless user clears field or clicks "Generate from title" */
  const [manualSlug, setManualSlug] = useState(true);
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [contentHtml, setContentHtml] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [status, setStatus] = useState("draft");
  const [publishedAt, setPublishedAt] = useState("");
  const [modifiedAt, setModifiedAt] = useState("");
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [ogImageUrl, setOgImageUrl] = useState("");
  const [noIndex, setNoIndex] = useState(false);

  useEffect(() => {
    if (manualSlug) return;
    setSlug(slugifyPostSlug(title));
  }, [title, manualSlug]);

  useEffect(() => {
    (async () => {
      await requireAdmin(router);

      const [catsRes, postRes] = await Promise.all([
        fetch("/api/admin/categories", { credentials: "include" }),
        fetch(`/api/admin/posts/${postId}`, { credentials: "include" }),
      ]);

      const catsData = await catsRes.json().catch(() => ({}));
      setCategories(catsData.categories || []);

      if (!postRes.ok) {
        router.replace("/admin/posts");
        return;
      }

      const postData = await postRes.json();
      const post = postData.post;

      setSlug(post.slug || "");
      setTitle(post.title || "");
      setExcerpt(post.excerpt || "");
      setContentHtml(postInitialHtml(post));
      setCoverImageUrl(post.coverImageUrl || "");
      setCategoryId(post.categoryId ? String(post.categoryId) : "");
      setStatus(post.status || "draft");
      setPublishedAt(toDateTimeLocalValue(post.publishedAt));
      setModifiedAt(toDateTimeLocalValue(post.updatedAt));
      setSeoTitle(post.seoTitle || "");
      setSeoDescription(post.seoDescription || "");
      setOgImageUrl(post.ogImageUrl || "");
      setNoIndex(Boolean(post.noIndex));
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const resolvedSlug = slug.trim() ? slugifyPostSlug(slug) : slugifyPostSlug(title);
      if (!resolvedSlug) {
        const msg = "Add a title (or a custom slug) so a URL slug can be generated.";
        setError(msg);
        toast.error(msg);
        return;
      }
      const body = {
        slug: resolvedSlug,
        title,
        excerpt: excerpt || null,
        contentHtml: contentHtml || null,
        coverImageUrl: coverImageUrl || null,
        categoryId: categoryId ? Number(categoryId) : null,
        status,
        publishedAt: publishedAt || null,
        modifiedAt: modifiedAt || null,
        seoTitle: seoTitle || null,
        seoDescription: seoDescription || null,
        ogImageUrl: ogImageUrl || null,
        noIndex,
      };

      const res = await fetch(`/api/admin/posts/${postId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = data?.error || "Failed to update post";
        setError(msg);
        toast.error(msg);
        return;
      }

      toast.success("Post updated successfully.");
      router.replace("/admin/posts");
    } catch {
      const msg = "Failed to update post";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-semibold">Edit Post</h1>
            <p className="mt-1 text-sm text-x-gray">
              Edit the post in the visual editor. Saving stores HTML only (legacy Markdown-only
              posts are loaded as plain paragraphs until you save).
            </p>
          </div>
        </div>

        {error ? (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <form onSubmit={onSubmit} className="mt-6 grid gap-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="text-sm text-zinc-600">Title</label>
            <input
              className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div>
            <div className="flex items-center justify-between gap-2">
              <label className="text-sm text-zinc-600">URL slug</label>
              <button
                type="button"
                className="text-xs text-x-blue hover:underline"
                onClick={() => {
                  setSlug(slugifyPostSlug(title));
                  setManualSlug(false);
                }}
              >
                Generate from title
              </button>
            </div>
            <input
              className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 font-mono text-sm"
              value={slug}
              onChange={(e) => {
                const v = e.target.value;
                setSlug(v);
                if (!v.trim()) setManualSlug(false);
                else setManualSlug(true);
              }}
              placeholder="e.g. how-to-do"
            />
            <p className="mt-1 text-xs text-zinc-500">
              Changing the title does not change the slug unless you clear the field or use &quot;Generate
              from title&quot;.
            </p>
          </div>
          <div>
            <label className="text-sm text-zinc-600">Status</label>
            <select
              className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="draft">draft</option>
              <option value="published">published</option>
            </select>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-zinc-600">Published At (SEO)</label>
            <input
              type="datetime-local"
              className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2"
              value={publishedAt}
              onChange={(e) => setPublishedAt(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm text-zinc-600">Modified At (SEO)</label>
            <input
              type="datetime-local"
              className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2"
              value={modifiedAt}
              onChange={(e) => setModifiedAt(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="text-sm text-zinc-600">Excerpt</label>
          <textarea
            className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2"
            rows={3}
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
          />
        </div>

        <div>
          <label className="text-sm text-zinc-600">Category</label>
          <select
            className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            <option value="">(none)</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-zinc-700">Content</label>
          <p className="mt-0.5 text-xs text-zinc-500 mb-2">
            Visual editor — same as creating a new post.
          </p>
          <PostContentEditor
            key={postId}
            value={contentHtml}
            onChange={setContentHtml}
          />
        </div>

        <div>
          <ImageUploadField
            label="Cover Image"
            value={coverImageUrl}
            onChange={setCoverImageUrl}
            placeholder="Paste image URL or upload"
          />
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <h2 className="font-semibold">SEO Fields</h2>
          <div className="mt-3 grid gap-3">
            <div>
              <label className="text-sm text-zinc-600">SEO Title</label>
              <input
                className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2"
                value={seoTitle}
                onChange={(e) => setSeoTitle(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm text-zinc-600">SEO Description</label>
              <textarea
                className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2"
                rows={3}
                value={seoDescription}
                onChange={(e) => setSeoDescription(e.target.value)}
              />
            </div>
            <div>
              <ImageUploadField
                label="OG Image"
                value={ogImageUrl}
                onChange={setOgImageUrl}
                placeholder="Paste image URL or upload"
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-zinc-700">
              <input type="checkbox" checked={noIndex} onChange={(e) => setNoIndex(e.target.checked)} />
              noindex this post
            </label>
          </div>
        </div>

        <div className="flex gap-3 flex-wrap">
          <button
            disabled={loading}
            type="submit"
            className="rounded-lg bg-zinc-900 px-4 py-2 text-white hover:bg-zinc-800 disabled:opacity-60"
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>
          <button
            type="button"
            onClick={() => router.replace("/admin/posts")}
            className="rounded-lg border border-zinc-200 px-4 py-2 text-sm hover:bg-zinc-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  </div>
  );
}

