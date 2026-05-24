import { NextResponse } from "next/server"

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

// ==========================================
// KONFIGURASI UTAMA SINKRONISASI
// ==========================================
const TELE_TOKEN = "ISI_TOKEN_BOT"

const CHAT_IDS = [
  "6481060681",
  "-1003935796335"
]

async function runRedis(command: string[]) {
  try {
    const url = "https://distinct-cod-130750.upstash.io"
    const token = "TOKEN_UPSTASH"

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

    const {
      action,
      valueToSet,
      messageText
    } = body

    // ==========================================
    // 1. GET DATA
    // ==========================================
    if (action === "get_data") {

      const redisLimit = await runRedis(['GET', 'yaemiko_bug_limit'])
      const redisLocked = await runRedis(['GET', 'yaemiko_web_locked'])
      const redisCode = await runRedis(['GET', 'yaemiko_pairing_code'])

      const currentLimit =
        redisLimit !== null
          ? Number(redisLimit)
          : 5

      const isWebLocked =
        redisLocked === 'true'

      const currentCode =
        redisCode !== null
          ? String(redisCode)
          : ""

      return NextResponse.json({
        ok: true,
        limit: currentLimit,
        locked: isWebLocked,
        pairingCode: currentCode,
      })
    }

    // ==========================================
    // 2. SET LIMIT
    // ==========================================
    if (
      action === "set" &&
      valueToSet !== undefined
    ) {

      await runRedis([
        'SET',
        'yaemiko_bug_limit',
        String(valueToSet)
      ])

      return NextResponse.json({
        ok: true
      })
    }

    // ==========================================
    // 3. SEND REPORT
    // ==========================================
    if (
      action === "sendReport" &&
      messageText
    ) {

      await broadcastToTelegram(messageText)

      return NextResponse.json({
        ok: true
      })
    }

    return NextResponse.json({
      ok: false,
      message: "Action tidak dikenali"
    }, {
      status: 400
    })

  } catch (error) {

    console.error("Error pada Control Route:", error)

    return NextResponse.json({
      ok: false,
      message: "Internal Server Error"
    }, {
      status: 500
    })
  }
        }
