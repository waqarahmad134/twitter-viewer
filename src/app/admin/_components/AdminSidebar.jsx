"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import LogoutButton from "./LogoutButton";
import { isManagerRole, useAdminIdentity } from "./AdminIdentityProvider";

const NavItem = ({ href, label, pathname }) => {
  const active = pathname === href || (href !== "/" && pathname.startsWith(href));
  return (
    <Link
      href={href}
      className={[
        "px-3 py-2 rounded-lg text-sm font-medium transition-colors block",
        active ? "bg-x-blue text-white" : "text-slate-200 hover:bg-white/10",
      ].join(" ")}
    >
      {label}
    </Link>
  );
};

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { admin } = useAdminIdentity();
  const hideSeoTools = isManagerRole(admin);

  // Login page should be distraction-free.
  if (pathname?.startsWith("/admin/login")) return null;

  return (
    <aside className="flex flex-col w-64 bg-slate-900 text-white border-r border-white/10 sticky top-0 h-screen">
      <div className="px-4 py-5">
        <div className="font-display font-bold text-xl">Twitter Viewer</div>
        <div className="mt-1 text-xs text-slate-300">Blog Admin</div>
      </div>

      <nav className="px-3 flex-1 space-y-1 pb-5">
        <NavItem href="/admin" label="Dashboard" pathname={pathname} />
        <NavItem href="/admin/media" label="Media" pathname={pathname} />
        <NavItem href="/admin/posts" label="Posts" pathname={pathname} />
        <NavItem href="/admin/categories" label="Categories" pathname={pathname} />
        <NavItem href="/admin/users" label="Accounts" pathname={pathname} />
        {!hideSeoTools ? (
          <>
            <NavItem href="/admin/settings" label="Site SEO" pathname={pathname} />
            <NavItem href="/admin/site-schemas" label="JSON-LD schemas" pathname={pathname} />
            <NavItem href="/admin/backup" label="Backup" pathname={pathname} />
          </>
        ) : null}
      </nav>

      <div className="p-4 border-t border-white/10">
        <LogoutButton onLogout={() => router.replace("/admin/login")} />
      </div>
    </aside>
  );
}

