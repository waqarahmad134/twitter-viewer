"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ImageUploadField from "../_components/ImageUploadField";
import { isManagerRole, useAdminIdentity } from "../_components/AdminIdentityProvider";
import { useAdminToast } from "../_components/AdminToastProvider";

function FieldLabel({ children }) {
  return <div className="text-sm font-medium text-zinc-700">{children}</div>;
}

export default function AdminSiteSeoSettingsPage() {
  const router = useRouter();
  const { admin, loading: idLoading } = useAdminIdentity();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const toast = useAdminToast();

  const [settings, setSettings] = useState({
    siteName: "",
    defaultDescription: "",
    defaultOgImageUrl: "",
    defaultOgTitle: "",
    defaultCanonicalBase: "",
    defaultNoindex: false,
    defaultTwitterCard: "summary_large_image",
    defaultTwitterSite: "",
    defaultTwitterCreator: "",
  });

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
      toast.error("Only administrators can edit site SEO.");
      router.replace("/admin");
      return;
    }

    (async () => {
      try {
        setLoading(true);
        setError("");

        const res = await fetch("/api/admin/settings", { credentials: "include" });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || "Failed to load settings");

        const s = data?.siteSettings || {};
        setSettings({
          siteName: s.siteName || "",
          defaultDescription: s.defaultDescription || "",
          defaultOgImageUrl: s.defaultOgImageUrl || "",
          defaultOgTitle: s.defaultOgTitle || "",
          defaultCanonicalBase: s.defaultCanonicalBase || "",
          defaultNoindex: Boolean(s.defaultNoindex),
          defaultTwitterCard: s.defaultTwitterCard || "summary_large_image",
          defaultTwitterSite: s.defaultTwitterSite || "",
          defaultTwitterCreator: s.defaultTwitterCreator || "",
        });
      } catch (e) {
        setError(e?.message || "Failed to load site SEO settings");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idLoading, admin]);

  async function onSave(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await requireAdmin();

      const payload = {
        siteName: settings.siteName || "Twitter Viewer",
        defaultDescription: settings.defaultDescription || null,
        defaultOgImageUrl: settings.defaultOgImageUrl || null,
        defaultOgTitle: settings.defaultOgTitle || null,
        defaultCanonicalBase: settings.defaultCanonicalBase || null,
        defaultNoindex: settings.defaultNoindex ? true : false,
        defaultTwitterCard: settings.defaultTwitterCard || null,
        defaultTwitterSite: settings.defaultTwitterSite || null,
        defaultTwitterCreator: settings.defaultTwitterCreator || null,
      };

      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to save settings");

      // Settings are “live” because Next reads them at request time.
      toast.success("Site SEO settings saved.");
    } catch (err) {
      const msg = err?.message || "Failed to save site SEO settings";
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Site SEO Settings</h1>
          <p className="mt-1 text-sm text-x-gray">
            Update global metadata (description, OG/Twitter, canonical). Indexing is controlled below and in Next.js metadata.
          </p>
        </div>
        <div className="text-sm text-x-gray">
          Changes apply immediately (no rebuild).
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {loading || idLoading ? (
        <div className="text-sm text-x-gray">Loading settings...</div>
      ) : (
        <form onSubmit={onSave} className="rounded-xl border border-slate-200 bg-white p-6 space-y-6">
          <div>
            <FieldLabel>Site Name</FieldLabel>
            <input
              className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
              value={settings.siteName}
              onChange={(e) => setSettings((p) => ({ ...p, siteName: e.target.value }))}
            />
          </div>

          <div>
            <FieldLabel>Default OG Title</FieldLabel>
            <input
              className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
              value={settings.defaultOgTitle}
              onChange={(e) =>
                setSettings((p) => ({ ...p, defaultOgTitle: e.target.value }))
              }
              placeholder="Open Graph / social title (optional; falls back to generated page title)"
            />
          </div>

          <div>
            <FieldLabel>Default Description</FieldLabel>
            <textarea
              className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
              rows={3}
              value={settings.defaultDescription}
              onChange={(e) =>
                setSettings((p) => ({ ...p, defaultDescription: e.target.value }))
              }
              placeholder="Short marketing description for homepage & pages without post-specific SEO."
            />
          </div>

          <div>
            <FieldLabel>Default OG Image</FieldLabel>
            <div className="mt-3">
              <ImageUploadField
                label="Default OG Image URL"
                value={settings.defaultOgImageUrl}
                onChange={(v) => setSettings((p) => ({ ...p, defaultOgImageUrl: v }))}
                placeholder=""
                uploadLabel="Upload"
              />
            </div>
          </div>

          <div>
            <FieldLabel>Canonical Base URL</FieldLabel>
            <input
              className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
              value={settings.defaultCanonicalBase}
              onChange={(e) =>
                setSettings((p) => ({
                  ...p,
                  defaultCanonicalBase: e.target.value,
                }))
              }
              placeholder="e.g. https://yourdomain.com"
            />
            <div className="mt-2 text-xs text-x-gray">
              Used for OpenGraph URL + canonical base.
            </div>
            <label className="mt-4 flex items-center gap-2 text-sm text-zinc-700">
              <input
                type="checkbox"
                checked={settings.defaultNoindex}
                onChange={(e) =>
                  setSettings((p) => ({ ...p, defaultNoindex: e.target.checked }))
                }
              />
              Noindex site by default (sets robots meta via Next.js)
            </label>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <FieldLabel>Twitter Card</FieldLabel>
              <input
                className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                value={settings.defaultTwitterCard}
                onChange={(e) =>
                  setSettings((p) => ({ ...p, defaultTwitterCard: e.target.value }))
                }
                placeholder="e.g. summary_large_image"
              />
            </div>
            <div>
              <FieldLabel>Twitter Site</FieldLabel>
              <input
                className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                value={settings.defaultTwitterSite}
                onChange={(e) =>
                  setSettings((p) => ({ ...p, defaultTwitterSite: e.target.value }))
                }
                placeholder="e.g. @yourhandle"
              />
            </div>
          </div>

          <div>
            <FieldLabel>Twitter Creator</FieldLabel>
            <input
              className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
              value={settings.defaultTwitterCreator}
              onChange={(e) =>
                setSettings((p) => ({ ...p, defaultTwitterCreator: e.target.value }))
              }
              placeholder="e.g. @creatorhandle"
            />
          </div>

          <div className="flex items-center justify-end gap-3 flex-wrap pt-2">
            <button
              type="button"
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-x-gray hover:bg-slate-50"
              onClick={() => router.refresh()}
              disabled={saving}
            >
              Reset
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-x-blue px-4 py-2 text-sm text-white hover:bg-x-blue/90 disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save SEO Settings"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

