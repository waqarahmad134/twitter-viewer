"use client";

import { useState } from "react";
import { useAdminToast } from "./AdminToastProvider";

export default function LogoutButton({ onLogout }) {
  const [loading, setLoading] = useState(false);
  const toast = useAdminToast();

  async function onClick() {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/auth/logout", {
        method: "POST",
        credentials: "include",
      }).catch(() => null);
      if (res?.ok) {
        toast.success("Logged out successfully.");
      } else {
        toast.error("Logout request failed.");
      }
    } finally {
      setLoading(false);
      onLogout?.();
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="w-full rounded-lg bg-white/10 hover:bg-white/15 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
    >
      {loading ? "Logging out..." : "Logout"}
    </button>
  );
}

