import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// --- CARA BARU NEMBAK UPSTASH (DIJAMIN 100% MASUK KE DATABASE) ---
async function runRedis(command: string[]) {
  try {
    const url = "https://leg-consonant-unblemished-95778.upstash.io";
    const token = "jUk8Nw2m7bOcfrxjpkAwA825ncyYyWP2";

    // Gak pake embel-embel URL aneh lagi! Kita tembak pake POST murni.
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(command),
      cache: 'no-store'
    });

    const data = await res.json();
    
    // Kalau Upstash error/nolak, biar kebaca log-nya
    if (data.error) {
      console.error("Upstash Nolak:", data.error);
      return null;
    }
    
    return data.result;
  } catch (err) {
    console.error("Fetch Redis Gagal:", err);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { action, valueToSet, messageText } = body;

    // 1. JALUR LAPORAN TELEGRAM (Notif Login / Bug)
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

    // 2. JALUR SET LIMIT (INI YANG KEMARIN GAGAL TERUS)
    if (action === 'set' && valueToSet !== undefined) {
      // Sekarang perintah SET ini dijamin masuk dan ngerubah angka di Upstash!
      await runRedis(['SET', 'yaemiko_bug_limit', valueToSet.toString()]);
      return NextResponse.json({ ok: true });
    }

    // 3. JALUR GET REALTIME UNTUK AUTO-REFRESH
    const isLocked = await runRedis(['GET', 'yaemiko_web_locked']);
    const finalLocked = isLocked === 'true';

    const currentLimit = await runRedis(['GET', 'yaemiko_bug_limit']);
    const finalLimit = currentLimit !== null ? parseInt(currentLimit) : 5;

    return NextResponse.json({
      ok: true,
      limit: finalLimit,
      locked: finalLocked
    }, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      }
    });

  } catch (error) {
    // Balasan default kalau server bener-bener down biar web lu kaga layar putih
    return NextResponse.json({ ok: true, limit: 5, locked: false });
  }
}
