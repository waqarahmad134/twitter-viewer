"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import SchemaForm from "../../_components/SchemaForm";
import { isManagerRole, useAdminIdentity } from "../../../_components/AdminIdentityProvider";
import { useAdminToast } from "../../../_components/AdminToastProvider";

export default function EditSiteSchemaPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id;
  const { admin, loading: idLoading } = useAdminIdentity();
  const toast = useAdminToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [initial, setInitial] = useState(null);
  const [error, setError] = useState("");

  async function requireAdmin() {
    const res = await fetch("/api/admin/auth/me", { credentials: "include" });
    if (!res.ok) router.replace("/admin/login");
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
      if (!id) return;
      try {
        setLoading(true);
        setError("");
        const res = await fetch(`/api/admin/site-schemas/${id}`, {
          credentials: "include",
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || "Failed to load");
        const s = data.schema;
        if (!s) throw new Error("Not found");
        setInitial({
          name: s.name,
          schemaJson: s.schemaJson,
          isActive: s.isActive,
          sortOrder: s.sortOrder,
        });
      } catch (e) {
        setError(e?.message || "Failed to load");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, idLoading, admin]);

  async function onSubmit(payload) {
    setSaving(true);
    try {
      await requireAdmin();
      const res = await fetch(`/api/admin/site-schemas/${id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to save");
      toast.success("Schema updated.");
      router.push("/admin/site-schemas");
    } catch (e) {
      toast.error(e?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  if (loading || idLoading || !admin?.id || isManagerRole(admin)) {
    return (
      <div className="text-sm text-zinc-600">Loading schema…</div>
    );
  }

  if (error || !initial) {
    return (
      <div className="rounded-lg bg-red-50 text-red-800 text-sm px-4 py-3">
        {error || "Not found"}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Edit JSON-LD schema</h1>
        <p className="mt-1 text-sm text-x-gray">ID: {id}</p>
      </div>
      <SchemaForm
        initial={initial}
        submitLabel={saving ? "Saving…" : "Save changes"}
        saving={saving}
        onSubmit={onSubmit}
        onCancel={() => router.push("/admin/site-schemas")}
      />
    </div>
  );
}
