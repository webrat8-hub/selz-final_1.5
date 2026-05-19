import { NextRequest, NextResponse } from 'next/server';

// Paksa Vercel untuk selalu render live, dilarang keras nge-cache!
export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function runRedis(command: string[]) {
  try {
    const url = "https://leg-consonant-unblemished-95778.upstash.io";
    const token = "jUk8Nw2m7bOcfrxjpkAwA825ncyYyWP2";
    
    // Tambahin timestamp unik di url biar fetch-nya gak di-cache sama internal server Vercel
    const cacheBuster = `?t=${Date.now()}`;
    const res = await fetch(`${url}/${command.join('/')}${cacheBuster}`, {
      headers: { Authorization: `Bearer ${token}` },
      method: 'GET',
      cache: 'no-store',
      next: { revalidate: 0 }
    });
    const data = await res.json();
    return data.result;
  } catch (err) {
    console.error("Redis Error:", err);
    return null;
  }
}

// Gunakan NextRequest (bukan Request biasa) biar Vercel tahu ini dynamic route tracker
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { action, valueToSet, messageText } = body;

    // 1. JALUR LAPORAN TELEGRAM
    if (action === 'sendReport' && messageText) {
      const BOT_TOKEN = '8208922468:AAGCSBYVOB-aRRz1s__rHZUwh2h5rSMsRbk';
      const CHAT_ID = '6481060681';

      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: CHAT_ID,
          text: messageText,
          parse_mode: 'Markdown'
        })
      });
      return NextResponse.json({ ok: true });
    }

    // 2. JALUR SET LIMIT (SAAT KLIK TOMBOL BUG)
    if (action === 'set' && valueToSet !== undefined) {
      await runRedis(['SET', 'yaemiko_bug_limit', valueToSet.toString()]);
      return NextResponse.json({ ok: true });
    }

    // 3. JALUR GET REALTIME (ANTI CACHE TOTAL)
    const isLocked = await runRedis(['GET', 'yaemiko_web_locked']);
    const finalLocked = isLocked === 'true';

    const currentLimit = await runRedis(['GET', 'yaemiko_bug_limit']);
    const finalLimit = currentLimit !== null ? parseInt(currentLimit) : 5;

    // Kirim response fresh dari database
    return NextResponse.json({
      ok: true,
      limit: finalLimit,
      locked: finalLocked
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });

  } catch (error) {
    return NextResponse.json({ ok: true, limit: 5, locked: false });
  }
}
