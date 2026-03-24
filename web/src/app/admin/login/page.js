"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAdminToast } from "../_components/AdminToastProvider";

async function checkMe() {
  const res = await fetch("/api/admin/auth/me", { credentials: "include" });
  return res.ok ? res.json() : null;
}

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const toast = useAdminToast();

  useEffect(() => {
    // If already logged in, skip login.
    (async () => {
      const me = await checkMe().catch(() => null);
      if (me?.admin?.id) router.replace("/admin");
    })();
  }, [router]);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const msg = data?.error || "Login failed";
        setError(msg);
        toast.error(msg);
        return;
      }
      toast.success("Login successful.");
      router.replace("/admin");
    } catch (err) {
      const msg = "Login failed. Check server logs and your credentials.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto">
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Admin Login</h1>
            <p className="mt-2 text-sm text-x-gray">
              Manage blog posts, categories, and SEO.
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-x-blue/10 text-x-blue flex items-center justify-center font-bold">
            A
          </div>
        </div>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="text-sm text-x-gray">Email</label>
          <input
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            autoComplete="email"
            required
          />
          </div>

          <div>
            <label className="text-sm text-x-gray" htmlFor="admin-password">
              Password
            </label>
            <div className="relative mt-1">
              <input
                id="admin-password"
                className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-3 pr-11"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-1 top-1/2 -translate-y-1/2 rounded-md px-2 py-1.5 text-sm text-zinc-500 hover:bg-slate-100 hover:text-zinc-800"
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
              >
                {showPassword ? (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                    />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <button
            disabled={loading}
            className="w-full rounded-lg bg-zinc-900 py-2 text-white hover:bg-zinc-800 disabled:opacity-60"
            type="submit"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className="mt-5 text-xs text-x-gray">
          Tip: Seed users with `npm run seed:admins` in `server/`.
        </div>
      </div>
    </div>
  );
}

