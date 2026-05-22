import { NextResponse } from "next/server"

// ==========================================
// KONFIGURASI TELEGRAM (UBAH SESUAI KEBUTUHAN)
// ==========================================
const TELE_TOKEN = "8208922468:AAGCSBYVOB-aRRz1s__rHZUwh2h5rSMsRbk"

// Gabungan ID: Chat Pribadi Lu & ID Grup Khusus Laporan (Diawali tanda minus)
const CHAT_IDS = [
  "6481060681",       // Telegram Pribadi
  "-100234567890"     // GANTI INI dengan ID Grup Laporan Lu! (wajib ada -100 di depan)
]

// Simulasi database internal sederhana (karena di client ada action get/set limit)
let globalLimit = 5
let isWebLocked = false

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

  // Jalankan semua pengiriman secara bersamaan agar cepat (Asynchronous)
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
    if (action === "get_data") {
      return NextResponse.json({
        ok: true,
        limit: globalLimit,
        locked: isWebLocked,
      })
    }

    // 2. ACTION: SET/UPDATE LIMIT DARI CLIENT
    if (action === "set" && valueToSet !== undefined) {
      globalLimit = Number(valueToSet)
      return NextResponse.json({ ok: true, message: `Limit berhasil diubah menjadi ${globalLimit}` })
    }

    // 3. ACTION: KIRIM LAPORAN (LOGIN / ATTACK BUG / COMMAND)
    if (action === "sendReport" && messageText) {
      // Langsung distribusikan laporan masuk ke pribadi + grup
      await broadcastToTelegram(messageText)
      return NextResponse.json({ ok: true, message: "Laporan berhasil dikirim ke semua channel tujuan" })
    }

    return NextResponse.json({ ok: false, message: "Action tidak dikenali" }, { status: 400 })
  } catch (error) {
    console.error("Error pada Control Route:", error)
    return NextResponse.json({ ok: false, message: "Internal Server Error" }, { status: 500 })
  }
           }
