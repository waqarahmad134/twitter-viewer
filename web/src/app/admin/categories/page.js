"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAdminToast } from "../_components/AdminToastProvider";

async function requireAdmin(router) {
  const res = await fetch("/api/admin/auth/me", { credentials: "include" });
  if (!res.ok) router.replace("/admin/login");
}

export default function AdminCategoriesPage() {
  const router = useRouter();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const toast = useAdminToast();

  async function loadCategories() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/categories", { credentials: "include" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || "Failed to load categories");
        return;
      }
      setCategories(data.categories || []);
    } catch {
      setError("Failed to load categories");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    (async () => {
      await requireAdmin(router);
      await loadCategories();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onDelete(id) {
    if (!confirm("Delete this category?")) return;
    const res = await fetch(`/api/admin/categories/${id}`, { method: "DELETE", credentials: "include" });
    if (res.ok) toast.success("Category deleted.");
    else toast.error("Failed to delete category.");
    await loadCategories();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Categories</h1>
          <p className="mt-1 text-sm text-x-gray">
            Manage category slug + SEO (used by blog pages).
          </p>
        </div>
        <Link
          href="/admin/categories/new"
          className="rounded-lg bg-zinc-900 px-3 py-2 text-sm text-white hover:bg-zinc-800"
        >
          New Category
        </Link>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        {loading ? (
          <div className="p-6 text-sm text-x-gray">Loading...</div>
        ) : categories.length === 0 ? (
          <div className="p-6 text-sm text-x-gray">No categories found.</div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Slug</th>
                <th className="px-4 py-3 font-medium">SEO Title</th>
                <th className="px-4 py-3 font-medium">Noindex</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c.id} className="border-t border-slate-100">
                  <td className="px-4 py-3">
                    <div className="font-medium">
                      <Link
                        href={`/admin/categories/${c.id}/edit`}
                        className="hover:underline"
                      >
                        {c.name}
                      </Link>
                    </div>
                    <div className="text-xs text-x-gray mt-1">id: {c.id}</div>
                  </td>
                  <td className="px-4 py-3 text-x-gray">{c.slug}</td>
                  <td className="px-4 py-3 text-x-gray">{c.seoTitle || <span className="text-xs">—</span>}</td>
                  <td className="px-4 py-3">
                    {c.noIndex ? (
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-700">
                        enabled
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs text-green-700">
                        off
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2 flex-wrap">
                      <Link
                        href={`/admin/categories/${c.id}/edit`}
                        className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-x-blue hover:bg-x-blue/5"
                      >
                        Edit
                      </Link>
                      <button
                        className="rounded-lg border border-red-200 px-3 py-2 text-xs text-red-700 hover:bg-red-50"
                        type="button"
                        onClick={() => onDelete(c.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

