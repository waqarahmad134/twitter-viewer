"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAdminToast } from "../_components/AdminToastProvider";

async function requireAdmin(router) {
  const res = await fetch("/api/admin/auth/me", { credentials: "include" });
  if (!res.ok) router.replace("/admin/login");
}

export default function AdminPostsPage() {
  const router = useRouter();
  const [posts, setPosts] = useState([]);
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const toast = useAdminToast();

  async function loadPosts(nextStatus = status) {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      params.set("limit", "500");
      if (nextStatus && (nextStatus === "draft" || nextStatus === "published")) {
        params.set("status", nextStatus);
      }
      if (q.trim().length >= 2) params.set("q", q.trim());

      const res = await fetch(`/api/admin/posts?${params.toString()}`, { credentials: "include" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.error || "Failed to load posts");
        return;
      }
      const data = await res.json();
      setPosts(data.posts || []);
    } catch (e) {
      setError("Failed to load posts");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await requireAdmin(router);
      if (cancelled) return;
      await loadPosts(status);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  async function onPublish(postId) {
    const res = await fetch(`/api/admin/posts/${postId}/publish`, { method: "POST", credentials: "include" });
    if (res.ok) toast.success("Post published.");
    else toast.error("Failed to publish post.");
    await loadPosts();
  }

  async function onUnpublish(postId) {
    const res = await fetch(`/api/admin/posts/${postId}/unpublish`, { method: "POST", credentials: "include" });
    if (res.ok) toast.success("Post moved to draft.");
    else toast.error("Failed to unpublish post.");
    await loadPosts();
  }

  async function onDelete(postId) {
    if (!confirm("Delete this post?")) return;
    const res = await fetch(`/api/admin/posts/${postId}`, { method: "DELETE", credentials: "include" });
    if (res.ok) toast.success("Post deleted.");
    else toast.error("Failed to delete post.");
    await loadPosts();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Posts</h1>
          <p className="mt-1 text-sm text-x-gray">
            All posts are listed by default. Filter by status or search.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link
            href="/admin/categories"
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-x-gray hover:bg-slate-50"
          >
            Categories
          </Link>
          <Link
            href="/admin/posts/new"
            className="rounded-lg bg-zinc-900 px-3 py-2 text-sm text-white hover:bg-zinc-800"
          >
            New Post
          </Link>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="text-sm text-x-gray">Status</label>
            <select
              className="mt-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">All (draft + published)</option>
              <option value="draft">Drafts only</option>
              <option value="published">Published only</option>
            </select>
          </div>

          <div className="flex-1 min-w-[220px]">
            <label className="text-sm text-x-gray">Search</label>
            <input
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="title or slug"
            />
          </div>

          <button
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-800 disabled:opacity-60"
            disabled={loading}
            onClick={() => loadPosts(status)}
            type="button"
          >
            {loading ? "Loading..." : "Apply"}
          </button>
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        {posts.length === 0 ? (
          <div className="p-6 text-sm text-x-gray">No posts found.</div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Updated</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((p) => {
                const updated = p.updatedAt ? new Date(p.updatedAt) : null;
                const updatedText = updated && !isNaN(updated.getTime()) ? updated.toLocaleDateString() : "-";
                return (
                  <tr key={p.id} className="border-t border-slate-100">
                    <td className="px-4 py-3">
                      <div className="font-medium">
                        <Link
                          href={`/admin/posts/${p.id}/edit`}
                          className="hover:underline"
                        >
                          {p.title}
                        </Link>
                      </div>
                      <div className="text-xs text-x-gray mt-1">{p.slug}</div>
                    </td>
                    <td className="px-4 py-3 text-x-gray">
                      {p.category?.name || <span className="text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      {p.status === "published" ? (
                        <span className="inline-flex items-center rounded-full bg-x-blue/10 px-2 py-1 text-xs text-x-blue">
                          published
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-700">
                          draft
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-x-gray">{updatedText}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2 flex-wrap">
                        <Link
                          href={`/admin/posts/${p.id}/edit`}
                          className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-x-blue hover:bg-x-blue/5"
                        >
                          Edit
                        </Link>
                        {p.status === "published" ? (
                          <button
                            className="rounded-lg border border-slate-200 px-3 py-2 text-xs text-x-gray hover:bg-slate-50"
                            type="button"
                            onClick={() => onUnpublish(p.id)}
                          >
                            Unpublish
                          </button>
                        ) : (
                          <button
                            className="rounded-lg bg-zinc-900 px-3 py-2 text-xs text-white hover:bg-zinc-800"
                            type="button"
                            onClick={() => onPublish(p.id)}
                          >
                            Publish
                          </button>
                        )}
                        <button
                          className="rounded-lg border border-red-200 px-3 py-2 text-xs text-red-700 hover:bg-red-50"
                          type="button"
                          onClick={() => onDelete(p.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

