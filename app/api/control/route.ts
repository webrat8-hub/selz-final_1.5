import { NextResponse } from "next/server"

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

// ==========================================
// KONFIGURASI UTAMA SINKRONISASI
// ==========================================
const TELE_TOKEN = "8769157554:AAEiE_eIDpwVWe2IXNr3Otz4SXrmJLwX3-8"

const CHAT_IDS = [
  "6481060681",
  "-1003935796335"
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
    return data? data.result : null

  } catch (err) {
    console.error("Upstash Error:", err)
    return null
  }
}

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

  await Promise.all(uploadPromises)
}

// ==========================================
// HANDLER ROUTE API FOR FRONT-END (POST)
// ==========================================
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { action, valueToSet, messageText } = body

    // 1. GET DATA
    if (action === "get_data") {
      const [redisLimit, redisLocked, redisCode, redisPhone] = await Promise.all([
        runRedis(['GET', 'yaemiko_bug_limit']),
        runRedis(['GET', 'yaemiko_web_locked']),
        runRedis(['GET', 'yaemiko_pairing_code']),
        runRedis(['GET', 'yaemiko_pairing_phone'])
      ])

      const currentLimit = redisLimit!== null? Number(redisLimit) : 5
      const isWebLocked = redisLocked === 'true'

      let codeToSend = ""
      // cuma kirim kode kalau ada dan belum di-ambil
      if (redisCode && redisPhone) {
        codeToSend = String(redisCode)
        // hapus biar ga kepake 2x
        await runRedis(['DEL', 'yaemiko_pairing_code'])
        await runRedis(['DEL', 'yaemiko_pairing_phone'])
      }

      return NextResponse.json({
        ok: true,
        limit: currentLimit,
        locked: isWebLocked,
        pairingCode: codeToSend,
      })
    }

    // 2. SET LIMIT
    if (action === "set" && valueToSet!== undefined) {
      await runRedis(['SET', 'yaemiko_bug_limit', String(valueToSet)])
      return NextResponse.json({ ok: true })
    }

    // 3. SEND REPORT - Dipake buat kirim /pair ke tele
    if (action === "sendReport" && messageText) {
      await broadcastToTelegram(messageText)
      return NextResponse.json({ ok: true })
    }

    // 4. SET CODE - Dipanggil pas lu kirim /code dari bot
    if (action === "set_code" && messageText) {
      const parts = messageText.split(' ')
      const code = parts[0]
      const phone = parts[1] || ""

      if (!code) {
        return NextResponse.json({ ok: false, message: "Code kosong" }, { status: 400 })
      }

      await runRedis(['SET', 'yaemiko_pairing_code', code])
      if (phone) {
        await runRedis(['SET', 'yaemiko_pairing_phone', phone])
      }

      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({
      ok: false,
      message: "Action tidak dikenali"
    }, { status: 400 })

  } catch (error) {
    console.error("Error pada Control Route:", error)
    return NextResponse.json({
      ok: false,
      message: "Internal Server Error"
    }, { status: 500 })
  }
        }
