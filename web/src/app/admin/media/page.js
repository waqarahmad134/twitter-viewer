"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAdminToast } from "../_components/AdminToastProvider";
import MediaUploadModal from "../_components/MediaUploadModal";
import MediaDetailModal from "../_components/MediaDetailModal";
import { resolveMediaUrl } from "@/lib/mediaUrl";

function buildDraftMap(items) {
  const map = {};
  for (const it of items) {
    map[it.id] = {
      title: it.title || "",
      altText: it.altText || "",
      caption: it.caption || "",
      description: it.description || "",
    };
  }
  return map;
}

export default function AdminMediaPage() {
  const router = useRouter();

  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [draftById, setDraftById] = useState({});

  const [uploading, setUploading] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const toast = useAdminToast();

  const [detailItem, setDetailItem] = useState(null);
  const [detailSaving, setDetailSaving] = useState(false);

  const canLoad = useMemo(() => true, []);

  async function requireAdmin() {
    const res = await fetch("/api/admin/auth/me", { credentials: "include" });
    if (!res.ok) router.replace("/admin/login");
  }

  async function loadMedia() {
    setLoading(true);
    setError("");
    try {
      await requireAdmin();
      const res = await fetch("/api/admin/media?limit=60", { credentials: "include" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to load media");
      const items = data.media || [];
      setMedia(items);
      setDraftById(buildDraftMap(items));
    } catch (e) {
      setError(e?.message || "Failed to load media");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!canLoad) return;
    loadMedia();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function uploadFiles(files) {
    if (!files || files.length === 0) {
      toast.error("Choose at least one image.");
      return;
    }

    setUploading(true);
    setError("");
    try {
      await requireAdmin();
      const formData = new FormData();
      for (const f of files) formData.append("files", f);

      const res = await fetch("/api/admin/media/upload", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Upload failed");
      await loadMedia();
      setUploadModalOpen(false);
      toast.success("Media uploaded successfully.");
    } catch (e) {
      const msg = e?.message || "Upload failed";
      setError(msg);
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  }

  async function persistMedia(id) {
    setError("");
    try {
      await requireAdmin();
      const draft = draftById[id] || {};
      const res = await fetch(`/api/admin/media/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: draft.title || null,
          altText: draft.altText || null,
          caption: draft.caption || null,
          description: draft.description || null,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to update media");
      await loadMedia();
      toast.success("Media details updated.");
      return data.media || null;
    } catch (e) {
      const msg = e?.message || "Failed to update media";
      setError(msg);
      toast.error(msg);
      throw e;
    }
  }

  async function onSaveFromModal() {
    if (!detailItem?.id) return;
    setDetailSaving(true);
    try {
      const updated = await persistMedia(detailItem.id);
      if (updated) setDetailItem(updated);
    } finally {
      setDetailSaving(false);
    }
  }

  async function onDelete(id) {
    if (!confirm("Delete this media?")) return;
    setError("");
    try {
      await requireAdmin();
      const res = await fetch(`/api/admin/media/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to delete media");
      if (detailItem?.id === id) {
        setDetailItem(null);
      }
      await loadMedia();
      toast.success("Media deleted.");
    } catch (e) {
      const msg = e?.message || "Failed to delete media";
      setError(msg);
      toast.error(msg);
    }
  }

  async function onDeleteFromModal() {
    if (!detailItem?.id) return;
    await onDelete(detailItem.id);
  }

  async function onCopyUrl(url) {
    const absolute = resolveMediaUrl(url, { absolute: true });
    try {
      await navigator.clipboard.writeText(absolute);
      toast.success("Media URL copied.");
    } catch {
      toast.error("Failed to copy URL.");
    }
  }

  function updateDraft(id, patch) {
    setDraftById((prev) => ({
      ...prev,
      [id]: { ...(prev[id] || {}), ...patch },
    }));
  }

  const detailDraft = detailItem ? draftById[detailItem.id] : null;

  return (
    <div className="space-y-6">
      <MediaUploadModal
        isOpen={uploadModalOpen}
        onClose={() => !uploading && setUploadModalOpen(false)}
        uploading={uploading}
        onUploadFiles={uploadFiles}
      />

      <MediaDetailModal
        open={Boolean(detailItem)}
        onClose={() => setDetailItem(null)}
        item={detailItem}
        draft={detailDraft}
        onDraftChange={(patch) => detailItem && updateDraft(detailItem.id, patch)}
        onSave={onSaveFromModal}
        onDelete={onDeleteFromModal}
        onCopyUrl={() => detailItem && onCopyUrl(detailItem.fileUrl)}
        saving={detailSaving}
      />

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Media Library</h1>
          <p className="mt-1 text-sm text-x-gray">
            Click an image for a WordPress-style detail view (large preview + metadata). Files are
            served via <code className="text-xs bg-slate-100 px-1 rounded">/uploads/</code> through
            your site URL.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={() => setUploadModalOpen(true)}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-800"
          >
            Upload media
          </button>
          <button
            type="button"
            onClick={() => loadMedia()}
            disabled={loading}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-x-gray hover:bg-slate-50 disabled:opacity-60"
          >
            Refresh
          </button>
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="text-sm text-x-gray">Loading media...</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {media.map((m) => {
            const thumbSrc = m.fileUrl ? resolveMediaUrl(m.fileUrl) : "";
            const draft = draftById[m.id] || {};
            const label = draft.title || m.title || m.fileName || "Image";
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setDetailItem(m)}
                className="group rounded-xl border border-slate-200 bg-white text-left overflow-hidden shadow-sm transition hover:border-x-blue/40 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-x-blue"
              >
                <div className="relative aspect-square bg-slate-100">
                  {thumbSrc ? (
                    <img
                      src={thumbSrc}
                      alt={draft.altText || m.altText || label}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-x-gray">
                      No preview
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 transition group-hover:bg-black/10" />
                </div>
                <div className="p-2 border-t border-slate-100">
                  <div className="line-clamp-2 text-xs font-medium text-zinc-800">{label}</div>
                  <div className="mt-0.5 text-[10px] text-x-gray">Click to edit</div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
