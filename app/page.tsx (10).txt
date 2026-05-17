"use client"

import React, { useState, useEffect, useRef } from "react"
import { Shield, Bug, LayoutDashboard, Settings, Loader2, Music, ChevronLeft, ChevronRight, Volume2, VolumeX, Zap, EyeOff, Copy, CheckCircle2, AlertTriangle, ExternalLink, Lock, Ghost, Skull, ZapOff, Activity, Ban } from "lucide-react"

export default function YaeMikoDashboard() {
  // --- 1. CLOUD PERSISTENCE STATES ---
  const [isHydrated, setIsHydrated] = useState(false);
  const [bugLimit, setBugLimit] = useState(0); 
  const [isWebLocked, setIsWebLocked] = useState(false);

  // --- 2. REGULAR STATES ---
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isMusicOn, setIsMusicOn] = useState(true);
  const [isStealth, setIsStealth] = useState(false);
  const [engineSpeed, setEngineSpeed] = useState("Normal");
  const [targetNumber, setTargetNumber] = useState("");
  const [currentView, setCurrentView] = useState('dashboard');
  const [activeNav, setActiveNav] = useState(0);
  const [isCopied, setIsCopied] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(38);

  // Overlay States
  const [showErrorOverlay, setShowErrorOverlay] = useState(false);
  const [showLimitPopup, setShowLimitPopup] = useState(false);
  const [showRestrictedOverlay, setShowRestrictedOverlay] = useState(false);

  const bgMusicRef = useRef<HTMLAudioElement>(null);

  const BUG_TYPES = [
    { name: "DELAY INVISIBLE", code: "delayLow", icon: <Ghost className="w-10 h-10 text-cyan-400" /> },
    { name: "FORCE CLOSE INVIS", code: "crashHigh", icon: <Skull className="w-10 h-10 text-red-500" /> },
    { name: "DALAY INVIS IOS", code: "blankTap" , icon: <ZapOff className="w-10 h-10 text-yellow-500" />},
    { name: "BLANK UI", code: "delayIOS", icon: <Activity className="w-10 h-10 text-pink-500" /> },
    { name: "CRASH ANDROID", code: "forceClose", icon: <Bug className="w-10 h-10 text-orange-500" /> },
  ];

  // --- FUNGSIONAL SYNC CLOUD VIA CONTROL API ---
  const syncWithCloud = async (action: 'get' | 'set' | 'sendReport', valueToSet?: number, messageText?: string) => {
    try {
      if (action === 'get') {
        const res = await fetch('/api/control', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'get' })
        });
        const data = await res.json();
        
        if (data.ok) {
          if (data.limit !== undefined) setBugLimit(data.limit);
          if (data.locked !== undefined) setIsWebLocked(data.locked);
        }
      } else if (action === 'set' && valueToSet !== undefined) {
        await fetch('/api/control', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'set', valueToSet })
        });
        setBugLimit(valueToSet);
      } else if (action === 'sendReport' && messageText) {
        await fetch('/api/control', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'sendReport', messageText })
        });
      }
    } catch {
      if (action === 'get') {
        setBugLimit(parseInt(localStorage.getItem('bugLimit') || '5'));
      }
    }
  };

  // --- AMBIL DATA SAAT STARTUP ---
  useEffect(() => {
    async function initData() {
      await syncWithCloud('get');
      setIsHydrated(true);
    }
    initData();
  }, []);

  // REALTIME AUTO REFRESH: Cukup cek status 'get' murni ke database tiap 3 detik tanpa bawa embel-embel telegram command checker lagi!
  useEffect(() => {
    const autoRefresh = setInterval(async () => {
      await syncWithCloud('get');
    }, 3000);
    return () => clearInterval(autoRefresh);
  }, []);

  // Live Counter Users
  useEffect(() => {
    const interval = setInterval(() => {
      setOnlineUsers(prev => {
        const direction = Math.random() > 0.5 ? 1 : -1;
        const nextValue = prev + direction;
        return nextValue < 15 ? 16 : nextValue > 50 ? 49 : nextValue;
      });
    } , 8000);
    return () => clearInterval(interval);
  }, []);

  // Audio Logic
  useEffect(() => {
    if (bgMusicRef.current && isHydrated) {
      if (isMusicOn && isLoggedIn && !isWebLocked) {
        bgMusicRef.current.play().catch(() => {});
      } else {
        bgMusicRef.current.pause();
      }
    }
  }, [isMusicOn, isLoggedIn, isWebLocked, isHydrated]);

  const handleLogin = async () => {
    if (username === "Selz" && password === "Freebug") {
      setIsLoggedIn(true);
      setShowErrorOverlay(false);
      
      const logMsg = `🔔 *LAPORAN LOGIN DASHBOARD*\n\n👤 *User:* ${username}\n🔑 *Status:* Berhasil Masuk Web\n⏰ *Waktu:* ${new Date().toLocaleString('id-ID')} WIB`;
      await syncWithCloud('sendReport', undefined, logMsg);
    } else {
      setShowErrorOverlay(true);
      const alertMsg = `⚠️ *PERCOBAAN LOGIN GAGAL!*\n\n👤 *Username input:* ${username || 'Kosong'}\n🔑 *Password input:* ${password || 'Kosong'}\n🚨 *Peringatan:* Ada dongo yang coba asal nebak pass web lu!`;
      await syncWithCloud('sendReport', undefined, alertMsg);
    }
  };

  const handleSendBug = () => {
    if (targetNumber === "6289505198913") { 
      setShowRestrictedOverlay(true); 
      return; 
    }
    
    if (bugLimit <= 0) { 
      setShowLimitPopup(true); 
      return; 
    }
    
    setIsSending(true);
    const delay = engineSpeed === "Instant" ? 1000 : engineSpeed === "Fast" ? 2500 : 4000;
    
    setTimeout(async () => { 
      setIsSending(false); 
      const nextLimit = Math.max(0, bugLimit - 1);
      const selectedBug = BUG_TYPES[activeNav].name;

      const attackMsg = `🚀 *LAPORAN PENYERANGAN BUG*\n\n👤 *Pengirim:* ${username}\n🎯 *Target:* \`${targetNumber}\`\n👾 *Jenis Bug:* ${selectedBug}\n⚡ *Speed Engine:* ${engineSpeed}\n📉 *Sisa Limit User:* ${nextLimit}/5`;
      await syncWithCloud('sendReport', undefined, attackMsg);

      await syncWithCloud('set', nextLimit);
      localStorage.setItem('bugLimit', nextLimit.toString());
    }, delay);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(targetNumber);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  if (!isHydrated) return <div className="bg-black min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 text-cyan-400 animate-spin" /></div>;

  if (isWebLocked) {
    return (
      <div className="fixed inset-0 z-[99999] bg-black flex flex-col items-center justify-center p-10 text-center">
        <Ban className="w-32 h-32 text-red-600 mb-8 mx-auto animate-pulse" />
        <h1 className="text-4xl font-black italic uppercase text-white tracking-tighter mb-4">⚠️SYSTEM UNDER MAINTENANCE⚠️</h1>
        <p className="text-white/50 text-xs font-bold uppercase tracking-[0.3em] max-w-xs mx-auto">
          Sabar dongo, web lagi di update sama Selz. Balik lagi nanti kalau udah selesai update nya.
        </p>
        <Loader2 className="w-4 h-4 text-red-600 animate-spin mt-10" />
      </div>
    );
  }

  return (
    <div className={`relative min-h-screen bg-black text-white overflow-hidden transition-opacity duration-500 ${isStealth ? 'opacity-30' : 'opacity-100'}`}>
      
      {/* Background Media */}
      <div className="fixed inset-0 z-0">
        <video autoPlay loop muted playsInline className="w-full h-full object-cover opacity-40"><source src="/bg-anime.mp4" type="video/mp4" /></video>
        <div className="absolute inset-0 bg-gradient-to-b from-[#050b14]/70 to-black"></div>
      </div>
      <audio ref={bgMusicRef} src="/audio.mp3" loop />

      {/* --- OVERLAYS --- */}
      {showErrorOverlay && (
        <div className="fixed inset-0 z-[10005] bg-red-950/90 flex flex-col items-center justify-center p-8 text-center backdrop-blur-3xl animate-bg_rumble">
          <AlertTriangle className="w-32 h-32 text-red-500 mb-8 mx-auto animate-shake_violent" />
          <h1 className="text-4xl font-black italic uppercase text-white animate-glitch_extreme">CREATE AKUN KE BOT DONGO!</h1>
          <a href="https://t.me/lalaypo_bot" target="_blank" className="mt-10 bg-white text-black py-5 px-10 rounded-full font-black uppercase text-xs">BOT</a>
          <button onClick={() => setShowErrorOverlay(false)} className="mt-4 text-white/20 font-bold uppercase text-[9px]">COBA LAGI</button>
        </div>
      )}

      {showRestrictedOverlay && (
        <div className="fixed inset-0 z-[10006] bg-red-900/95 flex flex-col items-center justify-center p-8 text-center backdrop-blur-3xl animate-pulse">
          <Shield className="w-40 h-40 text-white mb-6" />
          <h1 className="text-4xl font-black italic uppercase text-white tracking-tighter">ACCESS DENIED</h1>
          <p className="text-white/70 text-xs mt-4 mb-10 font-bold uppercase">MAU NGAPAIN LU KONTOL, NOMOR INI DALAM PERLINDUNGAN ADMIN SELZ</p>
          <button onClick={() => setShowRestrictedOverlay(false)} className="px-12 py-4 bg-white text-black font-black uppercase text-xs rounded-full shadow-2xl">KEMBALI</button>
        </div>
      )}

      {isSending && (
        <div className="fixed inset-0 z-[10002] bg-black/80 flex flex-col items-center justify-center backdrop-blur-md">
          <Loader2 className="w-28 h-28 text-pink-500 animate-spin mb-6" />
          <p className="font-black italic uppercase text-sm tracking-[0.5em] text-cyan-400 animate-pulse text-center">SEDANG MENGIRIM BUG KE TARGET</p>
        </div>
      )}

      {showLimitPopup && (
        <div className="fixed inset-0 z-[10001] bg-black/95 flex flex-col items-center justify-center p-8 text-center backdrop-blur-md">
          <Bug className="w-32 h-32 text-red-600 mx-auto mb-6 animate-shake_violent" />
          <h2 className="text-4xl font-black italic uppercase text-red-500 mb-2">LIMIT LU ABIS NGENTOD</h2>
          <p className="text-white/40 text-[10px] font-bold tracking-widest mb-10 uppercase">PREMIUM KE BOT LAH NGENTOD KAGA MALU PAKE AKUN FREE MULU😹</p>
          <a href="https://t.me/lalaypo_bot" target="_blank" className="bg-white text-black py-6 px-10 rounded-3xl font-black uppercase text-xs flex items-center gap-2">
            <ExternalLink size={16} /> BOT
          </a>
          <button onClick={() => setShowLimitPopup(false)} className="mt-4 text-white/20 font-black uppercase text-[9px]">LIMIT BAKALAN RESET SETELAH 24 JAM</button>
        </div>
      )}

      {/* --- CONTENT --- */}
      {!isLoggedIn ? (
        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-6">
          <h1 className="text-3xl font-black italic uppercase text-cyan-400 tracking-tighter mb-10 text-center">
            YAE MIKO <span className="text-[10px] text-white/30 block tracking-[0.5em]">VERSI 1.5</span>
          </h1>
          <div className="w-full max-w-sm bg-white/5 border border-white/10 backdrop-blur-3xl rounded-[3rem] p-10 shadow-2xl">
            <div className="space-y-4">
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full bg-black/60 border border-white/10 p-5 rounded-2xl text-center font-bold text-xs text-white outline-none" placeholder="USERNAME" />
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-black/60 border border-white/10 p-5 rounded-2xl text-center font-bold text-xs text-white outline-none" placeholder="PASSWORD" />
              <button onClick={handleLogin} className="w-full py-5 bg-cyan-600 rounded-full font-black uppercase italic text-xs text-white flex items-center justify-center gap-3 active:scale-95 transition-all">
                <Lock size={16}/> LOGIN
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative z-10 p-6 max-w-md mx-auto min-h-screen">
          {currentView === 'dashboard' ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex justify-between items-center mb-6">
                <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400">SPEED: {engineSpeed}</span>
                <span className={`text-[10px] font-black uppercase px-4 py-1 rounded-full border ${bugLimit > 0 ? 'text-pink-500 border-pink-500/20 bg-pink-500/10' : 'text-red-500 border-red-500/20 bg-red-500/10'}`}>LIMIT: {bugLimit}/5</span>
              </div>
              <div className="bg-gradient-to-br from-white/10 to-transparent border border-white/10 rounded-[2.5rem] p-6 mb-6 text-center backdrop-blur-md relative shadow-2xl overflow-hidden">
                <div className="flex justify-between items-center absolute inset-x-2 top-1/2 -translate-y-1/2 z-10 px-2">
                   <button onClick={() => setActiveNav(prev => (prev - 1 + BUG_TYPES.length) % BUG_TYPES.length)} className="p-2 bg-black/40 rounded-full active:scale-90 transition-all"><ChevronLeft size={20}/></button>
                   <button onClick={() => setActiveNav(prev => (prev + 1) % BUG_TYPES.length)} className="p-2 bg-black/40 rounded-full active:scale-90 transition-all"><ChevronRight size={20}/></button>
                </div>
                <div className="mb-3 flex justify-center">{BUG_TYPES[activeNav].icon}</div>
                <h2 className="text-xl font-black italic uppercase mb-6">{BUG_TYPES[activeNav].name}</h2>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-black/60 p-3 rounded-xl border border-white/5">
                    <p className="text-lg font-black text-cyan-400 leading-none">{bugLimit}</p>
                    <p className="text-[6px] text-white/40 uppercase font-bold mt-1">LIMIT</p>
                  </div>
                  <div className="bg-black/60 p-3 rounded-xl border border-white/5">
                    <p className={`text-lg font-black leading-none ${bugLimit > 0 ? 'text-green-500' : 'text-red-600'}`}>{bugLimit > 0 ? 'ACT' : 'OFF'}</p>
                    <p className="text-[6px] text-white/40 uppercase font-bold mt-1">STATUS</p>
                  </div>
                  <div className="bg-black/60 p-3 rounded-xl border border-white/5">
                    <p className="text-lg font-black text-white leading-none">{onlineUsers}</p>
                    <p className="text-[6px] text-white/40 uppercase font-bold mt-1">ONLINE</p>
                  </div>
                </div>
              </div>
              <div className="relative mb-6">
                <input value={targetNumber} onChange={(e) => setTargetNumber(e.target.value)} className="w-full bg-black/60 border border-white/10 p-5 rounded-[2rem] text-center font-black italic text-lg text-cyan-400 pr-16 outline-none focus:border-cyan-500 transition-all" placeholder="628XXXXXXXX" />
                <button onClick={copyToClipboard} className="absolute right-5 top-1/2 -translate-y-1/2 text-white/40 hover:text-cyan-400 transition-colors">
                  {isCopied ? <CheckCircle2 size={24} className="text-green-500" /> : <Copy size={24} />}
                </button>
              </div>
              <button onClick={handleSendBug} className="w-full py-5 bg-gradient-to-r from-pink-600 via-red-600 to-orange-600 rounded-[2.5rem] font-black uppercase italic text-xs text-white shadow-xl active:scale-95 transition-all">KIRIM BUG</button>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-lg font-black italic uppercase mb-10 border-b border-white/10 pb-4 text-cyan-400">Setting Selz</h2>
              <div className="space-y-5">
                <div className="bg-white/5 p-6 rounded-[2.5rem] border border-white/5 backdrop-blur-lg shadow-xl">
                  <div className="flex items-center gap-3 mb-5 text-[10px] font-black uppercase text-white/60 italic"><Zap size={16} className="text-cyan-400"/> Engine Speed</div>
                  <div className="flex gap-2">
                    {["Normal", "Fast", "Instant"].map((speed) => (
                      <button key={speed} onClick={() => setEngineSpeed(speed)} className={`flex-1 py-4 rounded-2xl text-[9px] font-black border transition-all ${engineSpeed === speed ? 'bg-cyan-500 text-black border-cyan-400' : 'bg-black/40 text-white/40 border-transparent'}`}>{speed}</button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between bg-white/5 p-6 rounded-[2.5rem] border border-white/5">
                  <div className="flex items-center gap-4"><EyeOff className="text-pink-500" size={22} /><span className="text-xs font-black uppercase italic">Stealth Mode</span></div>
                  <button onClick={() => setIsStealth(!isStealth)} className={`w-14 h-7 rounded-full relative transition-all ${isStealth ? 'bg-cyan-500' : 'bg-white/10'}`}><div className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all ${isStealth ? 'right-1' : 'left-1'}`}></div></button>
                </div>
                <div className="flex items-center justify-between bg-white/5 p-6 rounded-[2.5rem] border border-white/5">
                  <div className="flex items-center gap-4"><Music className="text-cyan-400" size={22} /><span className="text-xs font-black uppercase italic">Audio Output</span></div>
                  <button onClick={() => setIsMusicOn(!isMusicOn)} className={`p-3 rounded-2xl transition-all ${isMusicOn ? 'bg-cyan-500 text-black' : 'bg-black/40 text-white/40'}`}>
                    {isMusicOn ? <Volume2 size={20}/> : <VolumeX size={20}/>}
                  </button>
                </div>
                <button onClick={() => { setIsLoggedIn(false); setUsername(""); setPassword(""); }} className="w-full flex items-center justify-center gap-4 py-6 bg-red-600/10 border border-red-600/20 rounded-[2.5rem] text-[10px] font-black uppercase italic text-red-500 hover:bg-red-600 hover:text-white transition-all">LOG OUT</button>
              </div>
            </div>
          )}
          <div className="fixed bottom-8 left-16 right-16 bg-[#0a1628]/95 border border-white/10 p-4 rounded-[2.5rem] flex justify-around backdrop-blur-3xl z-20 shadow-2xl">
            <button onClick={() => setCurrentView('dashboard')} className={`p-1 transition-all ${currentView === 'dashboard' ? 'text-cyan-400 scale-110' : 'text-white/20'}`}><LayoutDashboard size={22}/></button>
            <button onClick={() => setCurrentView('settings')} className={`p-1 transition-all ${currentView === 'settings' ? 'text-cyan-400 scale-110' : 'text-white/20'}`}><Settings size={22}/></button>
          </div>
        </div>
      )}

      {/* Global CSS for Animations */}
      <style jsx global>{`
        @keyframes shake { 0% { transform: translate(2px, 2px); } 10% { transform: translate(-1px, -2px); } 100% { transform: translate(0); } }
        .animate-shake_violent { animation: shake 0.1s infinite; }
        @keyframes rumble { 0%, 100% { background-color: rgba(69, 10, 10, 0.9); } 50% { background-color: rgba(127, 29, 29, 0.95); } }
        .animate-bg_rumble { animation: rumble 0.15s infinite; }
        @keyframes glitch { 0% { text-shadow: 2px 0 #ff0000, -2px 0 #00ffff; } 100% { text-shadow: -2px 0 #ff0000, 2px 0 #00ffff; } }
        .animate-glitch_extreme { animation: glitch 0.1s infinite; }
        .animate-in { animation: fadeIn 0.5s ease-out forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  )
    }
