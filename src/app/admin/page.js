/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

function Badge({ children, variant }) {
  const cls =
    variant === "blue"
      ? "inline-flex items-center rounded-full bg-x-blue/10 px-2 py-1 text-xs text-x-blue"
      : variant === "green"
        ? "inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs text-green-700"
        : "inline-flex items-center rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-700";
  return <span className={cls}>{children}</span>;
}

export default function AdminHomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [categories, setCategories] = useState([]);
  const [publishedPosts, setPublishedPosts] = useState([]);
  const [draftPosts, setDraftPosts] = useState([]);

  async function requireAdmin() {
    const res = await fetch("/api/admin/auth/me", { credentials: "include" });
    if (!res.ok) router.replace("/admin/login");
  }

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        await requireAdmin();

        const [catsRes, pubRes, draftRes] = await Promise.all([
          fetch("/api/admin/categories", { credentials: "include" }),
          fetch("/api/admin/posts?status=published&limit=500", { credentials: "include" }),
          fetch("/api/admin/posts?status=draft&limit=500", { credentials: "include" }),
        ]);

        const catsData = await catsRes.json().catch(() => ({}));
        const pubData = await pubRes.json().catch(() => ({}));
        const draftData = await draftRes.json().catch(() => ({}));

        if (!catsRes.ok) throw new Error(catsData?.error || "Failed to load categories");
        if (!pubRes.ok) throw new Error(pubData?.error || "Failed to load published posts");
        if (!draftRes.ok) throw new Error(draftData?.error || "Failed to load draft posts");

        setCategories(catsData.categories || []);
        setPublishedPosts(pubData.posts || []);
        setDraftPosts(draftData.posts || []);
      } catch (e) {
        setError(e?.message || "Failed to load admin dashboard");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const totals = useMemo(() => {
    return {
      categories: categories.length,
      published: publishedPosts.length,
      drafts: draftPosts.length,
    };
  }, [categories.length, publishedPosts.length, draftPosts.length]);

  const categoryCounts = useMemo(() => {
    const map = new Map();
    for (const c of categories) {
      map.set(String(c.id), { category: c, published: 0, drafts: 0 });
    }
    for (const p of publishedPosts) {
      if (!p.categoryId) continue;
      const item = map.get(String(p.categoryId));
      if (item) item.published += 1;
    }
    for (const p of draftPosts) {
      if (!p.categoryId) continue;
      const item = map.get(String(p.categoryId));
      if (item) item.drafts += 1;
    }
    return Array.from(map.values());
  }, [categories, publishedPosts, draftPosts]);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Dashboard</h1>
            <p className="mt-1 text-sm text-x-gray">
              Manage blog posts, categories, and SEO.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-end">
            <Link
              href="/"
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-x-gray hover:bg-slate-50"
            >
              View Website
            </Link>
            <Link
              href="/blog"
              className="rounded-lg bg-x-blue px-3 py-2 text-sm text-white hover:bg-x-blue/90"
            >
              View Blog
            </Link>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="text-xs text-x-gray">Categories</div>
            <div className="mt-1 text-2xl font-semibold">{totals.categories}</div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="text-xs text-x-gray">Published Posts</div>
            <div className="mt-1 text-2xl font-semibold">{totals.published}</div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="text-xs text-x-gray">Draft Posts</div>
            <div className="mt-1 text-2xl font-semibold">{totals.drafts}</div>
          </div>
        </div>

        <div className="mt-5 flex gap-2 flex-wrap">
          <Link
            href="/admin/posts/new"
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-800"
          >
            + Add Post
          </Link>
          <Link
            href="/admin/categories/new"
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-x-gray hover:bg-slate-50"
          >
            + Add Category
          </Link>
          <Link
            href="/admin/posts"
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-x-gray hover:bg-slate-50"
          >
            Manage Posts
          </Link>
          <Link
            href="/admin/categories"
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-x-gray hover:bg-slate-50"
          >
            Manage Categories
          </Link>
          <Link
            href="/admin/backup"
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-x-gray hover:bg-slate-50"
          >
            Database Backup
          </Link>
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="text-sm text-x-gray">Loading dashboard...</div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between gap-3 flex-wrap">
            <div>
              <div className="text-sm font-semibold">Categories overview</div>
              <div className="text-xs text-x-gray mt-1">
                Draft + published counts per category.
              </div>
            </div>
          </div>
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {categoryCounts.length === 0 ? (
              <div className="text-sm text-x-gray">No categories yet.</div>
            ) : (
              categoryCounts.map((item) => (
                <div key={item.category.id} className="rounded-lg border border-slate-200 p-4 bg-slate-50">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold">{item.category.name}</div>
                      <div className="text-xs text-x-gray mt-1">/{item.category.slug}</div>
                    </div>
                    <Badge variant="blue">SEO</Badge>
                  </div>
                  <div className="mt-3 flex items-center gap-2 flex-wrap">
                    <Badge variant="green">{item.published} published</Badge>
                    <Badge variant="gray">{item.drafts} drafts</Badge>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
                    <Link
                      href={`/admin/categories/${item.category.id}/edit`}
                      className="text-sm font-medium text-x-blue hover:underline"
                    >
                      Edit category
                    </Link>
                    <Link
                      href="/admin/posts"
                      className="text-sm text-x-gray hover:underline"
                    >
                      Manage posts
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

