"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Modal to upload one or more images to the media library.
 */
export default function MediaUploadModal({
  isOpen,
  onClose,
  onUploadFiles,
  uploading = false,
}) {
  const fileRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [fileLabel, setFileLabel] = useState("");

  const resetInput = useCallback(() => {
    if (fileRef.current) fileRef.current.value = "";
    setFileLabel("");
  }, []);

  useEffect(() => {
    if (!isOpen) {
      resetInput();
      setDragOver(false);
    }
  }, [isOpen, resetInput]);

  useEffect(() => {
    if (!isOpen) return;
    function onKey(e) {
      if (e.key === "Escape") onClose?.();
    }
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [isOpen, onClose]);

  function syncFilesToInput(files) {
    if (!fileRef.current || !files?.length) return;
    const dt = new DataTransfer();
    for (let i = 0; i < files.length; i++) {
      dt.items.add(files[i]);
    }
    fileRef.current.files = dt.files;
    const names = Array.from(files)
      .map((f) => f.name)
      .slice(0, 3)
      .join(", ");
    setFileLabel(
      files.length > 3 ? `${names} +${files.length - 3} more` : names || ""
    );
  }

  async function handleUpload() {
    const files = fileRef.current?.files;
    if (!files || files.length === 0) return;
    await onUploadFiles?.(files);
  }

  function onDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    const incoming = e.dataTransfer?.files;
    if (!incoming?.length) return;
    syncFilesToInput(incoming);
  }

  function onDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  }

  function onDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }

  function onFileInputChange(e) {
    const list = e.target.files;
    if (!list?.length) {
      setFileLabel("");
      return;
    }
    setFileLabel(
      list.length === 1
        ? list[0].name
        : `${list.length} files selected`
    );
  }

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="media-upload-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="Close dialog"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-lg rounded-xl border border-slate-200 bg-white shadow-xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
          <div>
            <h2 id="media-upload-title" className="text-lg font-semibold text-zinc-900">
              Upload media
            </h2>
            <p className="mt-1 text-sm text-x-gray">
              Images only. Select multiple files or drag them into the area below.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-zinc-500 hover:bg-slate-100 hover:text-zinc-800"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          <div
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            className={[
              "relative rounded-xl border-2 border-dashed px-4 py-12 text-center transition-colors",
              dragOver ? "border-x-blue bg-x-blue/5" : "border-slate-200 bg-slate-50/80",
            ].join(" ")}
          >
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              id="media-upload-input"
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              onChange={onFileInputChange}
            />
            <div className="pointer-events-none">
              <p className="text-sm font-medium text-zinc-800">Drop images here</p>
              <p className="mt-2 text-xs text-x-gray">or click to browse</p>
              {fileLabel ? (
                <p className="mt-3 text-xs font-mono text-x-blue break-all px-2">{fileLabel}</p>
              ) : null}
            </div>
          </div>

          <p className="text-xs text-x-gray">
            After upload, you can set title, alt text, and captions on each item in the grid.
          </p>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={uploading}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-x-gray hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={uploading}
              onClick={handleUpload}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-800 disabled:opacity-60"
            >
              {uploading ? "Uploading..." : "Upload"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
