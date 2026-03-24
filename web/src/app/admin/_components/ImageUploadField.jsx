"use client";

import { useRef, useState } from "react";
import { useAdminToast } from "./AdminToastProvider";
import { resolveMediaUrl } from "@/lib/mediaUrl";

export default function ImageUploadField({
  label,
  value,
  onChange,
  placeholder = "",
  uploadLabel = "Upload Image",
}) {
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const toast = useAdminToast();

  async function onUpload() {
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setUploadError("Select an image file first.");
      toast.error("Select an image file first.");
      return;
    }

    setUploading(true);
    setUploadError("");
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/admin/uploads/image", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || "Upload failed");
      }

      onChange?.(data?.url || "");
      toast.success("Image uploaded successfully.");
    } catch (err) {
      const msg = err?.message || "Upload failed";
      setUploadError(msg);
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-2">
      <label className="text-sm text-zinc-600">{label}</label>

      <div className="flex items-center gap-3 flex-wrap">
        <input
          className="flex-1 min-w-[220px] rounded-lg border border-zinc-200 bg-white px-3 py-2"
          value={value || ""}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
        />
        <input ref={fileRef} type="file" accept="image/*" className="text-sm" />
        <button
          type="button"
          disabled={uploading}
          onClick={onUpload}
          className="rounded-lg bg-zinc-900 px-3 py-2 text-sm text-white hover:bg-zinc-800 disabled:opacity-60"
        >
          {uploading ? "Uploading..." : uploadLabel}
        </button>
      </div>

      {uploadError ? (
        <div className="text-xs text-red-700">{uploadError}</div>
      ) : null}

      {value ? (
        <div className="pt-1">
          <img
            src={resolveMediaUrl(value)}
            alt={label}
            className="max-h-32 rounded-lg border border-slate-200 object-contain bg-white"
          />
        </div>
      ) : null}
    </div>
  );
}

