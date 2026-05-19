import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Fungsi nembak Upstash Redis secara direct via Fetch API
async function runRedis(command: string[]) {
  try {
    const url = "https://leg-consonant-unblemished-95778.upstash.io";
    const token = "jUk8Nw2m7bOcfrxjpkAwA825ncyYyWP2";
    
    const res = await fetch(`${url}/${command.join('/')}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store'
    });
    const data = await res.json();
    return data.result;
  } catch (err) {
    console.error("Redis Error:", err);
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { action, valueToSet, messageText } = body;

    // JALUR 1: Mengirim laporan ke bot Telegram lo (Login & Serangan Bug)
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

    // JALUR 2: Saat user klik tombol kirim bug, web bakal ngeset limit baru ke Redis
    if (action === 'set' && valueToSet !== undefined) {
      await runRedis(['SET', 'yaemiko_bug_limit', valueToSet.toString()]);
      return NextResponse.json({ ok: true });
    }

    // JALUR 3: SINKRONISASI REALTIME (Aksi 'get' yang jalan tiap 3 detik dari web lo)
    // 1. Ambil status kunci web
    const isLocked = await runRedis(['GET', 'yaemiko_web_locked']);
    const finalLocked = isLocked === 'true';

    // 2. Ambil sisa limit harian
    const currentLimit = await runRedis(['GET', 'yaemiko_bug_limit']);
    const finalLimit = currentLimit !== null ? parseInt(currentLimit) : 5;

    // BALASAN DATA JALUR AMAN: Harus ada object 'ok', 'limit', dan 'locked' biar dibaca page.tsx!
    return NextResponse.json({
      ok: true,
      limit: finalLimit,
      locked: finalLocked
    });

  } catch (error) {
    // Jika ada kendala, kasih status aman biar web ga langsung crash blank hitam
    return NextResponse.json({ ok: true, limit: 5, locked: false });
  }
  }
