"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { isManagerRole, useAdminIdentity } from "../_components/AdminIdentityProvider";
import { useAdminToast } from "../_components/AdminToastProvider";

export default function AdminSiteSchemasPage() {
  const router = useRouter();
  const { admin, loading: idLoading } = useAdminIdentity();
  const toast = useAdminToast();
  const [loading, setLoading] = useState(true);
  const [schemas, setSchemas] = useState([]);
  const [error, setError] = useState("");

  async function requireAdmin() {
    const res = await fetch("/api/admin/auth/me", { credentials: "include" });
    if (!res.ok) router.replace("/admin/login");
  }

  async function load() {
    const res = await fetch("/api/admin/site-schemas", {
      credentials: "include",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error || "Failed to load schemas");
    setSchemas(data.schemas || []);
  }

  useEffect(() => {
    if (idLoading) return;
    if (!admin?.id) {
      router.replace("/admin/login");
      return;
    }
    if (isManagerRole(admin)) {
      toast.error("Only administrators can manage JSON-LD schemas.");
      router.replace("/admin");
      return;
    }

    (async () => {
      try {
        setLoading(true);
        setError("");
        await load();
      } catch (e) {
        setError(e?.message || "Failed to load");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idLoading, admin]);

  async function onDelete(id) {
    if (!confirm("Delete this schema block?")) return;
    try {
      await requireAdmin();
      const res = await fetch(`/api/admin/site-schemas/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Delete failed");
      setSchemas((prev) => prev.filter((s) => s.id !== id));
      toast.success("Schema deleted.");
    } catch (e) {
      toast.error(e?.message || "Delete failed");
    }
  }

  if (loading || idLoading) {
    return (
      <div className="text-sm text-zinc-600">Loading JSON-LD schemas…</div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">JSON-LD schemas</h1>
          <p className="mt-1 text-sm text-x-gray max-w-xl">
            Add one or more complete JSON-LD objects. Each active block is
            rendered as a separate{" "}
            <code className="text-xs bg-zinc-100 px-1 rounded">
              &lt;script type=&quot;application/ld+json&quot;&gt;
            </code>{" "}
            on the public site (in addition to the default WebSite schema).
          </p>
        </div>
        <Link
          href="/admin/site-schemas/new"
          className="rounded-lg bg-x-blue text-white px-4 py-2 text-sm font-medium"
        >
          Add schema
        </Link>
      </div>

      {error ? (
        <div className="rounded-lg bg-red-50 text-red-800 text-sm px-4 py-3">
          {error}
        </div>
      ) : null}

      <div className="border border-zinc-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 text-left text-zinc-600">
            <tr>
              <th className="px-4 py-2 font-medium">Label</th>
              <th className="px-4 py-2 font-medium">Order</th>
              <th className="px-4 py-2 font-medium">Active</th>
              <th className="px-4 py-2 font-medium">Updated</th>
              <th className="px-4 py-2 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {schemas.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-zinc-500">
                  No custom schemas yet.{" "}
                  <Link href="/admin/site-schemas/new" className="text-x-blue">
                    Add one
                  </Link>
                  .
                </td>
              </tr>
            ) : (
              schemas.map((s) => (
                <tr key={s.id} className="border-t border-zinc-100">
                  <td className="px-4 py-3 font-medium">{s.name}</td>
                  <td className="px-4 py-3">{s.sortOrder}</td>
                  <td className="px-4 py-3">{s.isActive ? "Yes" : "No"}</td>
                  <td className="px-4 py-3 text-zinc-500">
                    {s.updatedAt
                      ? new Date(s.updatedAt).toLocaleString()
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <Link
                      href={`/admin/site-schemas/${s.id}/edit`}
                      className="text-x-blue hover:underline"
                    >
                      Edit
                    </Link>
                    <button
                      type="button"
                      onClick={() => onDelete(s.id)}
                      className="text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
