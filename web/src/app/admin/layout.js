import Link from "next/link";
import AdminSidebar from "./_components/AdminSidebar";
import { AdminIdentityProvider } from "./_components/AdminIdentityProvider";
import { AdminToastProvider } from "./_components/AdminToastProvider";

export default function AdminLayout({ children }) {
  return (
    <AdminToastProvider>
      <AdminIdentityProvider>
        <div className="min-h-screen flex bg-slate-50">
          <AdminSidebar />

          <div className="flex-1 min-w-0">
            <div className="border-b border-slate-200 bg-white">
              <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
                <div className="text-sm text-x-gray">Admin Panel</div>
                <div className="hidden sm:block text-xs text-x-gray">
                  <div className="flex items-center gap-4">
                    <Link href="/" className="hover:underline">
                      View Website
                    </Link>
                    <Link href="/blog" className="hover:underline">
                      View Blog
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
          </div>
        </div>
      </AdminIdentityProvider>
    </AdminToastProvider>
  );
}

