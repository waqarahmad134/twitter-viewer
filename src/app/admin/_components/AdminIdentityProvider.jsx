"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const AdminIdentityContext = createContext({
  admin: null,
  loading: true,
});

export function isManagerRole(admin) {
  return String(admin?.role || "").toLowerCase() === "manager";
}

export function AdminIdentityProvider({ children }) {
  const pathname = usePathname();
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (pathname?.startsWith("/admin/login")) {
      setAdmin(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/admin/auth/me", { credentials: "include" });
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        setAdmin(res.ok && data?.admin ? data.admin : null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [pathname]);

  return (
    <AdminIdentityContext.Provider value={{ admin, loading }}>
      {children}
    </AdminIdentityContext.Provider>
  );
}

export function useAdminIdentity() {
  return useContext(AdminIdentityContext);
}
