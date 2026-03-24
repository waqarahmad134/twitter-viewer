"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isManagerRole, useAdminIdentity } from "../_components/AdminIdentityProvider";
import { useAdminToast } from "../_components/AdminToastProvider";

function formatDt(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return String(iso);
  }
}

export default function AdminAccountsPage() {
  const router = useRouter();
  const { admin, loading: idLoading } = useAdminIdentity();
  const toast = useAdminToast();
  const readOnly = isManagerRole(admin);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [admins, setAdmins] = useState([]);

  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("manager");
  const [creating, setCreating] = useState(false);

  const [editing, setEditing] = useState(null);
  const [editRole, setEditRole] = useState("admin");
  const [editPassword, setEditPassword] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/admins", { credentials: "include" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to load accounts");
      setAdmins(Array.isArray(data.admins) ? data.admins : []);
    } catch (e) {
      setError(e?.message || "Failed to load accounts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (idLoading) return;
    if (!admin?.id) {
      router.replace("/admin/login");
      return;
    }
    void load();
  }, [idLoading, admin, router, load]);

  async function onCreate(e) {
    e.preventDefault();
    if (readOnly) return;
    setCreating(true);
    try {
      const res = await fetch("/api/admin/admins", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: newEmail,
          password: newPassword,
          role: newRole,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to create account");
      toast.success("Account created.");
      setNewEmail("");
      setNewPassword("");
      setNewRole("manager");
      await load();
    } catch (err) {
      toast.error(err?.message || "Create failed");
    } finally {
      setCreating(false);
    }
  }

  function startEdit(row) {
    setEditing(row.id);
    setEditRole(String(row.role || "manager").toLowerCase());
    setEditPassword("");
  }

  async function onSaveEdit(id) {
    if (readOnly) return;
    setSavingEdit(true);
    try {
      const body = { role: editRole };
      if (editPassword.trim()) body.password = editPassword;
      const res = await fetch(`/api/admin/admins/${id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to update");
      toast.success("Account updated.");
      setEditing(null);
      await load();
    } catch (err) {
      toast.error(err?.message || "Update failed");
    } finally {
      setSavingEdit(false);
    }
  }

  async function onDelete(id, email) {
    if (readOnly) return;
    if (!window.confirm(`Delete account ${email}? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/admin/admins/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to delete");
      toast.success("Account removed.");
      if (editing === id) setEditing(null);
      await load();
    } catch (err) {
      toast.error(err?.message || "Delete failed");
    }
  }

  if (idLoading || !admin?.id) {
    return <div className="text-sm text-x-gray">{idLoading ? "Loading…" : "Redirecting…"}</div>;
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-semibold">Accounts</h1>
        <p className="mt-1 text-sm text-x-gray">
          Everyone who can sign into this admin panel. Roles: <strong>admin</strong> (full access) or{" "}
          <strong>manager</strong> (content only — no SEO, backup, or account changes).
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
        <h2 className="text-sm font-semibold text-zinc-800">Public site users</h2>
        <p className="mt-2 text-sm text-x-gray">
          This app does not store separate “visitor” accounts. Blog readers do not log in. Only the
          accounts in the table below exist in the database.
        </p>
      </div>

      {readOnly ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          You are signed in as a <strong>manager</strong>. You can view this list but cannot add,
          edit, or delete accounts.
        </div>
      ) : null}

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {!readOnly ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
          <h2 className="text-lg font-semibold">Add administrator</h2>
          <form onSubmit={onCreate} className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-zinc-700">Email</label>
              <input
                type="email"
                required
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                autoComplete="off"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-zinc-700">Password</label>
              <input
                type="password"
                required
                minLength={8}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
              />
              <p className="mt-1 text-xs text-x-gray">At least 8 characters.</p>
            </div>
            <div>
              <label className="text-sm font-medium text-zinc-700">Role</label>
              <select
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white"
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
              >
                <option value="manager">manager</option>
                <option value="admin">admin</option>
              </select>
            </div>
            <div className="sm:col-span-2 flex justify-end">
              <button
                type="submit"
                disabled={creating}
                className="rounded-lg bg-x-blue px-4 py-2 text-sm text-white hover:bg-x-blue/90 disabled:opacity-60"
              >
                {creating ? "Creating…" : "Create account"}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between gap-3 flex-wrap">
          <h2 className="text-lg font-semibold">Administrators &amp; managers</h2>
          <button
            type="button"
            onClick={() => void load()}
            className="text-sm text-x-blue hover:underline"
            disabled={loading}
          >
            Refresh
          </button>
        </div>
        {loading ? (
          <div className="p-4 text-sm text-x-gray">Loading…</div>
        ) : admins.length === 0 ? (
          <div className="p-4 text-sm text-x-gray">No accounts found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold text-zinc-600 uppercase tracking-wide">
                <tr>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3">Updated</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {admins.map((row) => (
                  <tr key={row.id} className="align-top">
                    <td className="px-4 py-3 font-medium text-zinc-900">
                      {row.email}
                      {admin?.id === row.id ? (
                        <span className="ml-2 text-xs font-normal text-x-gray">(you)</span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      {editing === row.id ? (
                        <select
                          className="rounded-lg border border-slate-200 px-2 py-1 text-sm bg-white"
                          value={editRole}
                          onChange={(e) => setEditRole(e.target.value)}
                          disabled={readOnly}
                        >
                          <option value="manager">manager</option>
                          <option value="admin">admin</option>
                        </select>
                      ) : (
                        <span className="capitalize">{row.role}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-x-gray whitespace-nowrap">
                      {formatDt(row.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-x-gray whitespace-nowrap">
                      {formatDt(row.updatedAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {editing === row.id ? (
                        <div className="flex flex-col items-end gap-2">
                          <input
                            type="password"
                            placeholder="New password (optional)"
                            className="w-56 max-w-full rounded-lg border border-slate-200 px-2 py-1 text-xs"
                            value={editPassword}
                            onChange={(e) => setEditPassword(e.target.value)}
                            autoComplete="new-password"
                            disabled={readOnly}
                          />
                          <div className="flex gap-2">
                            <button
                              type="button"
                              className="text-xs text-x-gray hover:underline"
                              onClick={() => setEditing(null)}
                              disabled={savingEdit}
                            >
                              Cancel
                            </button>
                            {!readOnly ? (
                              <button
                                type="button"
                                className="rounded-lg bg-x-blue px-3 py-1 text-xs text-white disabled:opacity-60"
                                onClick={() => void onSaveEdit(row.id)}
                                disabled={savingEdit}
                              >
                                {savingEdit ? "Saving…" : "Save"}
                              </button>
                            ) : null}
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-end gap-3 flex-wrap">
                          {!readOnly ? (
                            <>
                              <button
                                type="button"
                                className="text-x-blue hover:underline"
                                onClick={() => startEdit(row)}
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                className="text-red-600 hover:underline disabled:opacity-40"
                                onClick={() => void onDelete(row.id, row.email)}
                                disabled={admin?.id === row.id}
                                title={
                                  admin?.id === row.id
                                    ? "You cannot delete your own account"
                                    : undefined
                                }
                              >
                                Delete
                              </button>
                            </>
                          ) : (
                            <span className="text-xs text-x-gray">—</span>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
