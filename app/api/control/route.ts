import { NextResponse } from "next/server"

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

// ==========================================
// KONFIGURASI UTAMA SINKRONISASI
// ==========================================
const TELE_TOKEN = "8208922468:AAGCSBYVOB-aRRz1s__rHZUwh2h5rSMsRbk"

// DI SINI KUNCINYA: Masukin ID Pribadi dan ID Grup Lu Selz!
const CHAT_IDS = [
  "6481060681",       // Telegram Pribadi
  "-1003935796335"     // ID Grup Laporan (Wajib pakai -100)
]

async function runRedis(command: string[]) {
  try {
    const url = "https://distinct-cod-130750.upstash.io"
    const token = "gQAAAAAAAf6-AAIgcDE2NTJlNDQwMGQ1ZWQ0NjY0YTY5NmNmNTMwNjNjNDk3OA"
    
    const res = await fetch(url, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(command),
      cache: 'no-store'
    })
    const data = await res.json()
    return data ? data.result : null
  } catch (err) {
    console.error("Upstash Error:", err)
    return null
  }
}

// Fungsi Broadcast yang diperbaiki agar stabil mengirim dua pesan beruntun ke banyak ID
async function broadcastToTelegram(pesan: string) {
  const uploadPromises = CHAT_IDS.map(async (id) => {
    try {
      await fetch(`https://api.telegram.org/bot${TELE_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: id,
          text: pesan,
          parse_mode: "Markdown",
        }),
        cache: 'no-store'
      })
    } catch (err) {
      console.error(`Gagal kirim ke ID ${id}:`, err)
    }
  })

  // Jalankan serentak untuk mempercepat eksekusi Vercel Serverless
  await Promise.all(uploadPromises)
}

// ==========================================
// HANDLER ROUTE API FOR FRONT-END (POST)
// ==========================================
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { action, valueToSet, messageText } = body

    // 1. ACTION: AMBIL DATA DARI UPSTASH REDIS
    if (action === "get_data") {
      const redisLimit = await runRedis(['GET', 'yaemiko_bug_limit'])
      const redisLocked = await runRedis(['GET', 'yaemiko_web_locked'])

      const currentLimit = redisLimit !== null ? Number(redisLimit) : 5
      const isWebLocked = redisLocked === 'true'

      return NextResponse.json({
        ok: true,
        limit: currentLimit,
        locked: isWebLocked,
      })
    }

    // 2. ACTION: SET/UPDATE LIMIT DARI CLIENT
    if (action === "set" && valueToSet !== undefined) {
      await runRedis(['SET', 'yaemiko_bug_limit', String(valueToSet)])
      return NextResponse.json({ ok: true })
    }

    // 3. ACTION: KIRIM LAPORAN (Menampung dua kiriman beruntun dari handleSendBug)
    if (action === "sendReport" && messageText) {
      await broadcastToTelegram(messageText)
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ ok: false, message: "Action tidak dikenali" }, { status: 400 })
  } catch (error) {
    console.error("Error pada Control Route:", error)
    return NextResponse.json({ ok: false, message: "Internal Server Error" }, { status: 500 })
  }
                  }
