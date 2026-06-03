"use client";
import { useState, useEffect } from "react";

export default function AdminPanel() {
  const [users, setUsers] = useState<any[]>([]);

  const loadUsers = async () => {
    const res = await fetch("/api/admin/get-all-users", { 
      headers: { "x-secret": localStorage.getItem("admin_key") || "" } 
    });
    const data = await res.json();
    setUsers(data.users || []);
  };

  const handleAction = async (username: string, action: string) => {
    await fetch("/api/admin/manage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, username, secret: localStorage.getItem("admin_key") })
    });
    loadUsers();
    alert("Action Success!");
  };

  useEffect(() => { loadUsers(); }, []);

  return (
    <div className="p-6 bg-black text-green-500 font-mono min-h-screen">
      <h1 className="text-2xl font-bold mb-6">USER MANAGEMENT</h1>
      <table className="w-full border border-green-800 text-sm">
        <thead>
          <tr className="bg-green-950">
            <th className="p-2 border border-green-800">User</th>
            <th className="p-2 border border-green-800">Limit Sisa</th>
            <th className="p-2 border border-green-800">Status</th>
            <th className="p-2 border border-green-800">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u: any) => (
            <tr key={u.username} className="border-b border-green-800 hover:bg-gray-900">
              <td className="p-2 border border-green-800">{u.username}</td>
              <td className="p-2 border border-green-800">{u.limit} / 5</td>
              <td className="p-2 border border-green-800">{u.locked ? "🔴 LOCKED" : "🟢 ACTIVE"}</td>
              <td className="p-2 border border-green-800 flex gap-2">
                <button onClick={() => handleAction(u.username, 'reset_limit')} className="bg-blue-800 px-2 py-1 text-white">RESET LIMIT</button>
                <button onClick={() => handleAction(u.username, 'toggle_lock')} className="bg-red-800 px-2 py-1 text-white">{u.locked ? 'UNLOCK' : 'LOCK'}</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
