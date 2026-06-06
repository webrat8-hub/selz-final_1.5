"use client";
import { useState, useEffect } from "react";

interface User {
  username: string;
  limit: number;
  locked: boolean;
  role: string;
  password?: string;
  isAdminBypassOn?: boolean; // Status bypass sender pribadi
}

export default function AdminPanel() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionMsg, setActionMsg] = useState("");

  // State form CREATE
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("user");

  // State edit inline
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editRole, setEditRole] = useState("");
  const [editPassword, setEditPassword] = useState("");

  // State online users
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);

  const getSecret = () => localStorage.getItem("admin_key") || "";

  const loadUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const secret = getSecret();
      if (!secret) {
        setError("🔑 Admin key tidak ditemukan. Login ulang sebagai admin.");
        setLoading(false);
        return;
      }
      const res = await fetch("/api/admin/get-all-users", { 
        headers: { "x-secret": secret } 
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || `HTTP ${res.status}`);
        setUsers([]);
      } else if (data.users) {
        setUsers(data.users);
      } else if (data.data) {
        setUsers(data.data);
      } else if (Array.isArray(data)) {
        setUsers(data);
      } else {
        setError("⚠ Format response tidak dikenal");
        setUsers([]);
      }
    } catch (err: any) {
      setError(err.message || "Gagal load users");
    } finally {
      setLoading(false);
    }
  };

  const loadOnlineUsers = async () => {
    try {
      const res = await fetch('/api/online-users');
      const data = await res.json();
      setOnlineUsers(data.users?.map((u: any) => u.username) || []);
    } catch (e) {}
  };

  const handleCreateUser = async () => {
    if (!newUsername || !newPassword) {
      alert("Isi username dan password dulu!");
      return;
    }
    setActionMsg("⏳ Membuat akun...");
    try {
      const res = await fetch("/api/admin/create-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          username: newUsername, 
          password: newPassword, 
          role: newRole, 
          secret: getSecret() 
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setActionMsg(`❌ Gagal: ${data.error}`);
      } else {
        setActionMsg(`✅ ${data.message}`);
        setNewUsername("");
        setNewPassword("");
        setNewRole("user");
        await loadUsers();
      }
    } catch (err: any) {
      setActionMsg(`❌ Error: ${err.message}`);
    }
  };

  const handleDeleteUser = async (username: string) => {
    if (!confirm(`☠ Yakin mau hapus akun "${username}"?`)) return;
    setActionMsg(`⏳ Menghapus ${username}...`);
    try {
      const res = await fetch("/api/admin/delete-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, secret: getSecret() })
      });
      const data = await res.json();
      if (!res.ok) {
        setActionMsg(`❌ Gagal: ${data.error}`);
      } else {
        setActionMsg(`✅ ${data.message}`);
        await loadUsers();
      }
    } catch (err: any) {
      setActionMsg(`❌ Error: ${err.message}`);
    }
  };

  const handleUpdateUser = async (username: string) => {
    const payload: any = { username, secret: getSecret() };
    if (editRole) payload.newRole = editRole;
    if (editPassword) payload.newPassword = editPassword;

    if (!editRole && !editPassword) {
      setEditingUser(null);
      return;
    }

    setActionMsg(`⏳ Mengupdate ${username}...`);
    try {
      const res = await fetch("/api/admin/update-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) {
        setActionMsg(`❌ Gagal: ${data.error}`);
      } else {
        setActionMsg(`✅ ${data.message}`);
        setEditingUser(null);
        setEditRole("");
        setEditPassword("");
        await loadUsers();
      }
    } catch (err: any) {
      setActionMsg(`❌ Error: ${err.message}`);
    }
  };

  const handleAction = async (username: string, action: string) => {
    setActionMsg(`⏳ ${action} untuk ${username}...`);
    try {
      const res = await fetch("/api/admin/manage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, username, secret: getSecret() })
      });
      const data = await res.json();
      if (!res.ok) {
        setActionMsg(`❌ Gagal: ${data.error}`);
      } else {
        setActionMsg(`✅ ${action} untuk ${username} berhasil!`);
        await loadUsers();
      }
    } catch (err: any) {
      setActionMsg(`❌ Error: ${err.message}`);
    }
  };

  useEffect(() => { 
    loadUsers();
    loadOnlineUsers();
    const onlineInterval = setInterval(loadOnlineUsers, 10000);
    return () => clearInterval(onlineInterval);
  }, []);

  return (
    <div className="p-6 bg-black text-green-500 font-mono min-h-screen">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6 border-b border-green-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-wider">☠ ADMIN PANEL v1.5</h1>
          <p className="text-[10px] text-green-700 mt-1 tracking-widest">
            ● {onlineUsers.length} ONLINE | {users.length} TOTAL USER
          </p>
        </div>
        <button 
          onClick={() => { loadUsers(); loadOnlineUsers(); }} 
          className="text-xs px-4 py-2 bg-green-900/50 border border-green-700 rounded hover:bg-green-800 transition"
        >
          ⟳ REFRESH
        </button>
      </div>

      {/* NOTIFICATION */}
      {error && (
        <div className="mb-4 p-4 bg-red-950 border border-red-800 rounded text-red-400 text-sm">
          ⚠ {error}
        </div>
      )}
      {actionMsg && (
        <div className="mb-4 p-3 bg-blue-950 border border-blue-800 rounded text-blue-400 text-xs">
          {actionMsg}
        </div>
      )}

      {/* STATS ROW */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-green-950/30 border border-green-800 rounded-xl p-4 text-center">
          <span className="text-3xl font-black text-green-500">{onlineUsers.length}</span>
          <p className="text-[10px] text-green-700 tracking-widest mt-1">ONLINE</p>
        </div>
        <div className="bg-green-950/30 border border-green-800 rounded-xl p-4 text-center">
          <span className="text-3xl font-black text-green-500">{users.length}</span>
          <p className="text-[10px] text-green-700 tracking-widest mt-1">TOTAL USER</p>
        </div>
        <div className="bg-green-950/30 border border-green-800 rounded-xl p-4 text-center">
          <span className="text-3xl font-black text-green-500">{users.filter((u: any) => u.locked).length}</span>
          <p className="text-[10px] text-green-700 tracking-widest mt-1">LOCKED</p>
        </div>
      </div>

      {/* FORM CREATE USER */}
      <div className="bg-green-950/50 border border-green-800 rounded-xl p-5 mb-6">
        <h2 className="text-lg font-bold text-green-400 mb-4 uppercase tracking-wider">✦ Create New Account</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input 
            placeholder="Username" 
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreateUser()}
            className="bg-black border border-green-800 p-3 rounded text-sm text-green-500 outline-none focus:border-green-400"
          />
          <input 
            placeholder="Password" 
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreateUser()}
            className="bg-black border border-green-800 p-3 rounded text-sm text-green-500 outline-none focus:border-green-400"
          />
          <select 
            value={newRole}
            onChange={(e) => setNewRole(e.target.value)}
            className="bg-black border border-green-800 p-3 rounded text-sm text-green-500 outline-none focus:border-green-400"
          >
            <option value="trial">🆓 TRIAL</option>
            <option value="member">✶ MEMBER</option>
            <option value="fullup">◈ FULLUP</option>
            <option value="reseller">💎 RESELLER</option>
            <option value="partner">𖤓 PARTNER</option>
            <option value="apex-partner">✦ PARTNER</option>
          </select>
          <button 
            onClick={handleCreateUser}
            className="bg-green-600 hover:bg-green-500 text-black font-bold p-3 rounded transition active:scale-95"
          >
            + CREATE
          </button>
        </div>
      </div>

      {/* TABLE USER */}
      {loading ? (
        <div className="text-center py-20 text-green-700 animate-pulse text-sm tracking-widest">
          ⟳ LOADING USER DATA...
        </div>
      ) : users.length === 0 && !error ? (
        <div className="text-center py-20 text-green-700 border border-dashed border-green-800 rounded-xl">
          ◉ TIDAK ADA USER TERDAFTAR
        </div>
      ) : (
        <div className="overflow-x-auto border border-green-800 rounded-xl">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-green-950 text-green-400 uppercase text-[10px] tracking-wider">
                <th className="p-3 border border-green-800">No</th>
                <th className="p-3 border border-green-800">Username</th>
                <th className="p-3 border border-green-800">Role</th>
                <th className="p-3 border border-green-800">Limit</th>
                <th className="p-3 border border-green-800">Status</th>
                <th className="p-3 border border-green-800">Bypass Sender</th>
                <th className="p-3 border border-green-800">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u: any, i: number) => {
                const isOnline = onlineUsers.includes(u.username);
                return (
                  <tr key={u.username} className={`border-b border-green-800 transition ${
                    isOnline ? 'bg-green-950/40' : 'hover:bg-green-950/20'
                  }`}>
                    <td className="p-3 border border-green-800 text-center text-green-700">{i + 1}</td>
                    <td className="p-3 border border-green-800 font-bold">
                      <span className="flex items-center gap-2">
                        <span className={`inline-block w-2.5 h-2.5 rounded-full ${
                          isOnline 
                            ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.8)]' 
                            : 'bg-gray-600'
                        }`}></span>
                        {u.username}
                        {isOnline && <span className="text-[8px] text-green-600 tracking-widest">ONLINE</span>}
                      </span>
                    </td>
                    <td className="p-3 border border-green-800">
                      {editingUser === u.username ? (
                        <select 
                          value={editRole || u.role} 
                          onChange={(e) => setEditRole(e.target.value)}
                          className="bg-black border border-green-800 p-1 text-xs rounded text-green-500 w-full"
                        >
                          <option value="user">USER</option>
                          <option value="admin">ADMIN</option>
                          <option value="reseller">RESELLER</option>
                          <option value="premium">PREMIUM</option>
                        </select>
                      ) : (
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          u.role === 'admin' ? 'bg-red-900/50 text-red-400' :
                          u.role === 'reseller' ? 'bg-purple-900/50 text-purple-400' :
                          u.role === 'premium' ? 'bg-yellow-900/50 text-yellow-400' :
                          'bg-green-900/50 text-green-400'
                        }`}>
                          {u.role?.toUpperCase() || 'USER'}
                        </span>
                      )}
                    </td>
                    <td className="p-3 border border-green-800 text-center">{u.limit ?? "?"}</td>
                    <td className="p-3 border border-green-800 text-center">
                      {u.locked ? (
                        <span className="text-red-500 font-bold">🔴 LOCKED</span>
                      ) : (
                        <span className="text-green-500 font-bold">🟢 ACTIVE</span>
                      )}
                    </td>
                    <td className="p-3 border border-green-800 text-center">
                      {u.isAdminBypassOn ? (
                        <span className="text-cyan-400 font-bold animate-pulse text-[11px] bg-cyan-950/40 px-2 py-1 rounded border border-cyan-800">⚡ UNLIMITED</span>
                      ) : (
                        <span className="text-gray-600 text-[11px]">🔒 NORMAL</span>
                      )}
                    </td>
                    <td className="p-3 border border-green-800">
                      {editingUser === u.username ? (
                        <div className="flex flex-col gap-2">
                          <input 
                            placeholder="Password baru (opsional)" 
                            type="password"
                            value={editPassword}
                            onChange={(e) => setEditPassword(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleUpdateUser(u.username)}
                            className="bg-black border border-green-800 p-1 text-xs rounded text-green-500 w-full"
                          />
                          <div className="flex gap-1">
                            <button onClick={() => handleUpdateUser(u.username)} className="flex-1 bg-green-700 hover:bg-green-600 px-2 py-1 text-[10px] rounded">SIMPAN</button>
                            <button onClick={() => { setEditingUser(null); setEditRole(""); setEditPassword(""); }} className="flex-1 bg-gray-700 hover:bg-gray-600 px-2 py-1 text-[10px] rounded">BATAL</button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          <button 
                            onClick={() => handleAction(u.username, u.isAdminBypassOn ? 'sender_off' : 'sender_on')} 
                            className={`px-2 py-1 text-[10px] rounded border font-black transition ${
                              u.isAdminBypassOn 
                                ? 'bg-cyan-900 hover:bg-cyan-800 border-cyan-700 text-cyan-400' 
                                : 'bg-black hover:bg-cyan-950 border-cyan-900 text-cyan-600'
                            }`}
                          >
                            {u.isAdminBypassOn ? 'BYPASS: OFF' : 'BYPASS: ON'}
                          </button>
                          <button onClick={() => handleAction(u.username, 'reset_limit')} className="bg-blue-900 hover:bg-blue-800 px-2 py-1 text-[10px] rounded border border-blue-700 transition">
                            RESET
                          </button>
                          <button onClick={() => handleAction(u.username, 'toggle_lock')} className={`px-2 py-1 text-[10px] rounded border transition ${
                            u.locked ? 'bg-green-900 hover:bg-green-800 border-green-700 text-green-400' : 'bg-red-900 hover:bg-red-800 border-red-700 text-red-400'
                          }`}>
                            {u.locked ? 'UNLOCK' : 'LOCK'}
                          </button>
                          <button 
                            onClick={() => { setEditingUser(u.username); setEditRole(u.role); setEditPassword(""); }} 
                            className="bg-yellow-900 hover:bg-yellow-800 px-2 py-1 text-[10px] rounded border border-yellow-700 text-yellow-400 transition"
                          >
                            EDIT
                          </button>
                          <button 
                            onClick={() => handleDeleteUser(u.username)} 
                            className="bg-red-900 hover:bg-red-800 px-2 py-1 text-[10px] rounded border border-red-700 text-red-400 transition"
                          >
                            HAPUS
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* FOOTER */}
      <div className="mt-6 text-[10px] text-green-800 border-t border-green-800/30 pt-4 flex justify-between items-center">
        <span className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.6)]"></span>
          {onlineUsers.length} online dari {users.length} user
        </span>
        <span>☠ SELZ SECURITY SYSTEMS</span>
      </div>
    </div>
  );
}
