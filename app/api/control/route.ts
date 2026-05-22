import { NextResponse } from "next/server"

// ==========================================
// KONFIGURASI TELEGRAM
// ==========================================
const TELE_TOKEN = "8208922468:AAGCSBYVOB-aRRz1s__rHZUwh2h5rSMsRbk"

// Gabungan ID: Chat Pribadi Lu & ID Grup Khusus Laporan
const CHAT_IDS = [
  "6481060681",       // Telegram Pribadi
  "-1003935796335"     // ID Grup Laporan Lu
]

// Simpan data di memory server
let globalLimit = 5
let isWebLocked = false // Ini yang ngontrol status maintenance website

// Fungsi pembantu untuk membungkus perulangan kirim pesan ke semua Chat ID
async function broadcastToTelegram(pesan: string) {
  const uploadPromises = CHAT_IDS.map(async (id) => {
    try {
      const res = await fetch(`https://api.telegram.org/bot${TELE_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: id,
          text: pesan,
          parse_mode: "Markdown",
        }),
      })
      if (!res.ok) {
        console.error(`Telegram API error untuk ID ${id}: ${res.statusText}`)
      }
    } catch (err) {
      console.error(`Gagal koneksi kirim ke ID ${id}:`, err)
    }
  })

  await Promise.all(uploadPromises)
}

// ==========================================
// HANDLER ROUTE API (POST METHOD)
// ==========================================
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { action, valueToSet, messageText } = body

    // 1. ACTION: AMBIL DATA LIMIT & STATUS LOCK WEB
    // (Fungsi ini dipanggil front-end via autoRefresh tiap 15 detik)
    if (action === "get_data") {
      return NextResponse.json({
        ok: true,
        limit: globalLimit,
        locked: isWebLocked, // Status terbaru dikirim ke front-end
      })
    }

    // 2. ACTION: SET/UPDATE LIMIT DARI CLIENT
    if (action === "set" && valueToSet !== undefined) {
      globalLimit = Number(valueToSet)
      return NextResponse.json({ ok: true, message: `Limit berhasil diubah menjadi ${globalLimit}` })
    }

    // 3. ACTION: KIRIM LAPORAN (LOGIN / ATTACK BUG / COMMAND)
    if (action === "sendReport" && messageText) {
      await broadcastToTelegram(messageText)
      return NextResponse.json({ ok: true, message: "Laporan berhasil dikirim ke semua channel tujuan" })
    }

    // 🔥 4. ACTION BARU: UNTUK MENGUNCI WEBSITE (DIPANGGIL OLEH SCRIPT BOT TELE LU)
    if (action === "lock_web") {
      isWebLocked = true
      await broadcastToTelegram("🔒 *SYSTEM NOTICE:* Website dashboard telah berhasil dikunci oleh Admin!")
      return NextResponse.json({ ok: true, locked: true, message: "Website berhasil dikunci" })
    }

    // 🔥 5. ACTION BARU: UNTUK MEMBUKA WEBSITE (DIPANGGIL OLEH SCRIPT BOT TELE LU)
    if (action === "unlock_web") {
      isWebLocked = false
      await broadcastToTelegram("🔓 *SYSTEM NOTICE:* Website dashboard telah dibuka kembali oleh Admin!")
      return NextResponse.json({ ok: true, locked: false, message: "Website berhasil dibuka" })
    }

    // 🔥 6. ACTION BARU: RESET LIMIT KE AWAL (DIPANGGIL OLEH SCRIPT BOT TELE LU)
    if (action === "reset_limit_bot") {
      globalLimit = 5
      await broadcastToTelegram("🔄 *SYSTEM NOTICE:* Limit semua user telah direset kembali ke 5!")
      return NextResponse.json({ ok: true, limit: 5, message: "Limit berhasil direset" })
    }

    return NextResponse.json({ ok: false, message: "Action tidak dikenali" }, { status: 400 })
  } catch (error) {
    console.error("Error pada Control Route:", error)
    return NextResponse.json({ ok: false, message: "Internal Server Error" }, { status: 500 })
  }
                    }
