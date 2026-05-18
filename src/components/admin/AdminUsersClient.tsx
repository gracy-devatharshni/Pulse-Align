"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Search, Edit, Trash2, Plus, Shield, ChevronDown, Check, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/cn";
import { useRouter } from "next/navigation";

const ROLES = ["EMPLOYEE", "MANAGER", "ADMIN"];

export function AdminUsersClient() {
  const [users, setUsers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [editUser, setEditUser] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "15",
        ...(search ? { search } : {}),
        ...(roleFilter ? { role: roleFilter } : {}),
      });
      const res = await fetch(`/api/admin/users?${params}`);
      const data = await res.json();
      setUsers(data.users || []);
      setTotal(data.total || 0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, [page, search, roleFilter]);

  const handleUpdate = async (userId: string, updates: any) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error("Failed to update user");
      toast.success("User updated!");
      setEditUser(null);
      fetchUsers();
    } catch {
      toast.error("Failed to update user");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (userId: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
      toast.success("User deleted");
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete user");
    }
  };

  const ROLE_COLORS: Record<string, string> = {
    EMPLOYEE: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    MANAGER: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    ADMIN: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">User Management</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {total} total users · Manage roles, departments, and reporting lines
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            placeholder="Search by name, email, or department..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="input-premium pl-9"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
          className="input-premium w-auto"
        >
          <option value="">All Roles</option>
          {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="card-elevated overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">User</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Role</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Department</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Manager</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Goals</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-border">
                    {[...Array(6)].map((_, j) => (
                      <td key={j} className="px-5 py-4"><div className="h-4 skeleton rounded" /></td>
                    ))}
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center">
                    <Users className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">No users found</p>
                  </td>
                </tr>
              ) : (
                users.map((u, i) => (
                  <motion.tr
                    key={u.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="border-b border-border table-row-hover"
                  >
                    {editUser?.id === u.id ? (
                      <EditRow
                        user={u}
                        allUsers={users}
                        onSave={(updates: any) => handleUpdate(u.id, updates)}
                        onCancel={() => setEditUser(null)}
                        saving={saving}
                      />
                    ) : (
                      <>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-foreground text-background flex items-center justify-center text-xs font-bold flex-shrink-0">
                              {u.name.charAt(0)}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-foreground">{u.name}</div>
                              <div className="text-xs text-muted-foreground">{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <span className={cn("status-badge", ROLE_COLORS[u.role])}>
                            {u.role}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-sm text-muted-foreground">{u.department || "—"}</td>
                        <td className="px-5 py-3 text-sm text-muted-foreground">{u.manager?.name || "—"}</td>
                        <td className="px-5 py-3 text-right font-mono text-sm text-foreground">{u._count?.goals || 0}</td>
                        <td className="px-5 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setEditUser(u)}
                              className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(u.id, u.name)}
                              className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-muted-foreground hover:text-red-600 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {total > 15 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-border">
            <span className="text-sm text-muted-foreground">
              Showing {(page - 1) * 15 + 1}–{Math.min(page * 15, total)} of {total}
            </span>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-accent disabled:opacity-40">Previous</button>
              <button onClick={() => setPage(page + 1)} disabled={page * 15 >= total} className="px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-accent disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function EditRow({ user, allUsers, onSave, onCancel, saving }: any) {
  const [role, setRole] = useState(user.role);
  const [department, setDepartment] = useState(user.department || "");
  const [designation, setDesignation] = useState(user.designation || "");
  const [managerId, setManagerId] = useState(user.managerId || "");

  const managers = allUsers.filter((u: any) => u.id !== user.id && (u.role === "MANAGER" || u.role === "ADMIN"));

  return (
    <>
      <td className="px-5 py-3" colSpan={2}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-foreground text-background flex items-center justify-center text-xs font-bold">{user.name.charAt(0)}</div>
          <div>
            <div className="text-sm font-medium text-foreground">{user.name}</div>
            <select value={role} onChange={(e) => setRole(e.target.value)} className="input-premium py-1 text-xs mt-0.5">
              {["EMPLOYEE", "MANAGER", "ADMIN"].map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        </div>
      </td>
      <td className="px-5 py-3">
        <input value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="Department" className="input-premium py-1 text-xs" />
      </td>
      <td className="px-5 py-3">
        <select value={managerId} onChange={(e) => setManagerId(e.target.value)} className="input-premium py-1 text-xs">
          <option value="">No manager</option>
          {managers.map((m: any) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
      </td>
      <td className="px-5 py-3">
        <input value={designation} onChange={(e) => setDesignation(e.target.value)} placeholder="Designation" className="input-premium py-1 text-xs" />
      </td>
      <td className="px-5 py-3">
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => onSave({ role, department, designation, managerId: managerId || null })}
            disabled={saving}
            className="p-1.5 rounded-lg bg-foreground text-background hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <Check className="w-4 h-4" />
          </button>
          <button onClick={onCancel} className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      </td>
    </>
  );
}
