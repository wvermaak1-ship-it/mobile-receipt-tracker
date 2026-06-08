"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatOMR } from "@/lib/format-omr";
import type { Profile } from "@/types/database";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [resetUserId, setResetUserId] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadUsers() {
    const res = await fetch("/api/admin/users");
    if (res.ok) {
      const data = await res.json();
      setUsers(data.users ?? []);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  async function createUser(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, full_name: fullName }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Failed to create user");
      return;
    }
    setMessage(`User ${username} created.`);
    setUsername("");
    setPassword("");
    setFullName("");
    loadUsers();
  }

  async function resetPassword(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    const res = await fetch("/api/admin/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: resetUserId, password: newPassword }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Failed to reset password");
      return;
    }
    setMessage("Password reset successfully.");
    setResetUserId("");
    setNewPassword("");
  }

  const employees = users.filter((u) => u.role === "employee");

  return (
    <main className="p-6 space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
        <p className="text-slate-500 text-sm">Create accounts and reset passwords</p>
      </div>

      {message && <p className="text-sm text-teal-700 bg-teal-50 p-3 rounded-lg">{message}</p>}
      {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Create Employee</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={createUser} className="space-y-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Username</Label>
              <Input value={username} onChange={(e) => setUsername(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required />
            </div>
            <Button type="submit" disabled={loading}>Create user</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Reset Password</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={resetPassword} className="space-y-4">
            <div className="space-y-2">
              <Label>Employee</Label>
              <select
                className="flex h-11 w-full rounded-lg border border-slate-200 px-3 text-sm bg-white"
                value={resetUserId}
                onChange={(e) => setResetUserId(e.target.value)}
                required
              >
                <option value="">Select employee…</option>
                {employees.map((u) => (
                  <option key={u.id} value={u.id}>{u.full_name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>New Password</Label>
              <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} minLength={8} required />
            </div>
            <Button type="submit" variant="secondary" disabled={loading}>Reset password</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">All Users</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {users.map((u) => (
            <div key={u.id} className="flex justify-between text-sm py-2 border-b border-slate-100">
              <span>{u.full_name} <span className="text-slate-400">({u.role})</span></span>
              <span className="text-slate-500">{formatOMR(u.budget_amount)} budget</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </main>
  );
}
