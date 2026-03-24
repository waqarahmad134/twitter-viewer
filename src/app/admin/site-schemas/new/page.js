"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import SchemaForm from "../_components/SchemaForm";
import { isManagerRole, useAdminIdentity } from "../../_components/AdminIdentityProvider";
import { useAdminToast } from "../../_components/AdminToastProvider";

export default function NewSiteSchemaPage() {
  const router = useRouter();
  const { admin, loading: idLoading } = useAdminIdentity();
  const toast = useAdminToast();
  const [saving, setSaving] = useState(false);

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
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idLoading, admin]);

  async function onSubmit(payload) {
    setSaving(true);
    try {
      await requireAdmin();
      const res = await fetch("/api/admin/site-schemas", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to save");
      toast.success("Schema created.");
      router.push("/admin/site-schemas");
    } catch (e) {
      toast.error(e?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  if (idLoading || !admin?.id || isManagerRole(admin)) {
    return (
      <div className="text-sm text-zinc-600">Loading…</div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">New JSON-LD schema</h1>
        <p className="mt-1 text-sm text-x-gray">
          Paste a complete JSON-LD object (or array). It will be validated and
          stored.
        </p>
      </div>
      <SchemaForm
        submitLabel={saving ? "Saving…" : "Create"}
        saving={saving}
        onSubmit={onSubmit}
        onCancel={() => router.push("/admin/site-schemas")}
      />
    </div>
  );
}
