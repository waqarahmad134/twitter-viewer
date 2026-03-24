"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isManagerRole, useAdminIdentity } from "../_components/AdminIdentityProvider";
import { useAdminToast } from "../_components/AdminToastProvider";

export default function AdminBackupPage() {
  const router = useRouter();
  const { admin, loading: idLoading } = useAdminIdentity();
  const toast = useAdminToast();
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (idLoading) return;
    if (!admin?.id) {
      router.replace("/admin/login");
      return;
    }
    if (isManagerRole(admin)) {
      toast.error("Only administrators can download database backups.");
      router.replace("/admin");
    }
  }, [idLoading, admin, router, toast]);

  async function downloadBackup() {
    setDownloading(true);
    try {
      const res = await fetch("/api/admin/backup", {
        credentials: "include",
        method: "GET",
      });

      const contentType = res.headers.get("Content-Type") || "";
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || `Backup failed (${res.status})`);
      }

      if (contentType.includes("application/json")) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Unexpected JSON response from backup");
      }

      const blob = await res.blob();
      const cd = res.headers.get("Content-Disposition") || "";
      let filename = "database-backup.sql";
      const utf8 = /filename\*=UTF-8''([^;]+)/i.exec(cd);
      if (utf8?.[1]) {
        try {
          filename = decodeURIComponent(utf8[1]);
        } catch {
          filename = utf8[1];
        }
      } else {
        const m = /filename="([^"]+)"/i.exec(cd);
        if (m?.[1]) filename = m[1];
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("Backup downloaded.");
    } catch (e) {
      const msg = e?.message || "Backup failed";
      toast.error(msg);
    } finally {
      setDownloading(false);
    }
  }

  if (idLoading || !admin?.id || isManagerRole(admin)) {
    return (
      <div className="text-sm text-x-gray">
        {idLoading ? "Loading…" : "Redirecting…"}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-semibold">Database backup</h1>
        <p className="mt-1 text-sm text-x-gray">
          Download a full SQL dump of the MySQL database used by this site (posts, categories,
          media, settings, admins, etc.). Store the file securely; it contains sensitive data.
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <strong>Security:</strong> The backup includes admin password hashes and all content.
          Keep it offline and never commit it to git.
        </div>

        <button
          type="button"
          onClick={() => void downloadBackup()}
          disabled={downloading}
          className="rounded-lg bg-x-blue px-4 py-2 text-sm font-medium text-white hover:bg-x-blue/90 disabled:opacity-60"
        >
          {downloading ? "Preparing backup…" : "Download .sql backup"}
        </button>

        <p className="text-xs text-x-gray">
          Restore by importing the file in MySQL (e.g.{" "}
          <code className="rounded bg-slate-100 px-1 py-0.5 text-[11px]">
            mysql -u USER -p DB_NAME &lt; backup.sql
          </code>
          ).
        </p>
      </div>
    </div>
  );
}
