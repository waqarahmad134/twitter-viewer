"use client";

import { useEffect } from "react";
import { resolveMediaUrl } from "@/lib/mediaUrl";

/**
 * WordPress-style attachment details: large preview left, fields right.
 */
export default function MediaDetailModal({
  open,
  onClose,
  item,
  draft,
  onDraftChange,
  onSave,
  onDelete,
  onCopyUrl,
  saving = false,
}) {
  useEffect(() => {
    if (!open) return;
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !item) return null;

  const src = item.fileUrl ? resolveMediaUrl(item.fileUrl) : "";
  const alt = draft?.altText || item.altText || item.title || "Attachment preview";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="media-detail-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-[1px]"
        aria-label="Close"
        onClick={onClose}
      />

      <div className="relative z-10 flex w-full max-w-5xl max-h-[90vh] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl md:flex-row">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-20 rounded-lg border border-slate-200 bg-white/95 px-2.5 py-1 text-sm text-zinc-600 shadow-sm hover:bg-slate-50"
        >
          Close
        </button>

        {/* Left: large preview */}
        <div className="flex min-h-[200px] flex-1 items-center justify-center bg-zinc-900/5 md:max-w-[55%] md:border-r md:border-slate-200">
          {src ? (
            <img
              src={src}
              alt={alt}
              className="max-h-[min(70vh,720px)] w-full object-contain p-4"
            />
          ) : (
            <p className="text-sm text-x-gray">No file URL</p>
          )}
        </div>

        {/* Right: details */}
        <div className="flex w-full flex-col overflow-y-auto md:max-w-[45%] md:shrink-0">
          <div className="border-b border-slate-100 p-5 pt-12 md:pt-5">
            <h2 id="media-detail-title" className="text-lg font-semibold text-zinc-900">
              Attachment details
            </h2>
            <p className="mt-1 break-all text-xs text-x-gray">{item.fileName || "—"}</p>
            {item.mimeType ? (
              <p className="mt-0.5 text-xs text-x-gray">{item.mimeType}</p>
            ) : null}
          </div>

          <div className="flex-1 space-y-4 p-5">
            <div>
              <label className="text-xs font-medium text-zinc-600">Title</label>
              <input
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                value={draft?.title ?? ""}
                onChange={(e) => onDraftChange({ title: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-600">Alt text</label>
              <input
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                value={draft?.altText ?? ""}
                onChange={(e) => onDraftChange({ altText: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-600">Caption</label>
              <textarea
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                rows={3}
                value={draft?.caption ?? ""}
                onChange={(e) => onDraftChange({ caption: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-600">Description</label>
              <textarea
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                rows={3}
                value={draft?.description ?? ""}
                onChange={(e) => onDraftChange({ description: e.target.value })}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 p-5">
            <button
              type="button"
              onClick={() => onSave()}
              disabled={saving}
              className="rounded-lg bg-x-blue px-4 py-2 text-sm font-medium text-white hover:bg-x-blue/90 disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={() => onCopyUrl()}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-zinc-700 hover:bg-slate-50"
            >
              Copy URL
            </button>
            <button
              type="button"
              onClick={() => onDelete()}
              className="ml-auto rounded-lg border border-red-200 px-4 py-2 text-sm text-red-700 hover:bg-red-50"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
