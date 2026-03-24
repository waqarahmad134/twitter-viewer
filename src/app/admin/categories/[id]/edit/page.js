"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ImageUploadField from "../../../_components/ImageUploadField";
import { useAdminToast } from "../../../_components/AdminToastProvider";

async function requireAdmin(router) {
  const res = await fetch("/api/admin/auth/me", { credentials: "include" });
  if (!res.ok) router.replace("/admin/login");
}

export default function AdminEditCategoryPage({ params }) {
  const { id: categoryId } = use(params);
  const router = useRouter();

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const toast = useAdminToast();

  const [slug, setSlug] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [ogImageUrl, setOgImageUrl] = useState("");
  const [noIndex, setNoIndex] = useState(false);

  useEffect(() => {
    (async () => {
      await requireAdmin(router);
      const res = await fetch(`/api/admin/categories/${categoryId}`, { credentials: "include" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        router.replace("/admin/categories");
        return;
      }
      const c = data.category;
      setSlug(c.slug || "");
      setName(c.name || "");
      setDescription(c.description || "");
      setSeoTitle(c.seoTitle || "");
      setSeoDescription(c.seoDescription || "");
      setOgImageUrl(c.ogImageUrl || "");
      setNoIndex(Boolean(c.noIndex));
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId]);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const body = {
        slug,
        name,
        description: description || null,
        seoTitle: seoTitle || null,
        seoDescription: seoDescription || null,
        ogImageUrl: ogImageUrl || null,
        noIndex,
      };

      const res = await fetch(`/api/admin/categories/${categoryId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = data?.error || "Failed to update category";
        setError(msg);
        toast.error(msg);
        return;
      }
      toast.success("Category updated successfully.");
      router.replace("/admin/categories");
    } catch {
      const msg = "Failed to update category";
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
            <h1 className="text-2xl font-semibold">Edit Category</h1>
            <p className="mt-1 text-sm text-x-gray">Update category SEO + slug.</p>
          </div>
        </div>

        {error ? (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <form onSubmit={onSubmit} className="mt-6 grid gap-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-zinc-600">Slug</label>
            <input
              className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="text-sm text-zinc-600">Name</label>
            <input
              className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
        </div>

        <div>
          <label className="text-sm text-zinc-600">Description</label>
          <textarea
            className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
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
              noindex this category
            </label>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            disabled={loading}
            type="submit"
            className="rounded-lg bg-zinc-900 px-4 py-2 text-white hover:bg-zinc-800 disabled:opacity-60"
          >
            {loading ? "Saving..." : "Save Category"}
          </button>
          <button
            type="button"
            onClick={() => router.replace("/admin/categories")}
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

