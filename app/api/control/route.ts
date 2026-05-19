import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Fungsi teruji nembak Upstash Redis secara langsung
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
    console.error("Gagal koneksi Redis:", err);
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { action, valueToSet, messageText } = body;

    // JALUR LALU LINTAS 1: Fitur ngirim laporan (Login / Serangan Bug) ke Bot Telegram
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

    // JALUR LALU LINTAS 2: Saat web ngubah limit sehabis klik tombol "KIRIM BUG"
    if (action === 'set' && valueToSet !== undefined) {
      await runRedis(['SET', 'yaemiko_bug_limit', valueToSet.toString()]);
      return NextResponse.json({ ok: true });
    }

    // JALUR LALU LINTAS 3: Ambil data realtime (Setiap 3 detik di-trigger oleh page.tsx lo)
    // Membaca sisa limit harian
    const currentLimit = await runRedis(['GET', 'yaemiko_bug_limit']);
    const finalLimit = currentLimit !== null ? parseInt(currentLimit) : 5;

    // Membaca status kunci website
    const isLocked = await runRedis(['GET', 'yaemiko_web_locked']);
    const finalLocked = isLocked === 'true'; // Jika string 'true' maka bernilai true asli

    // Return data dengan format bahasa yang dimengerti oleh page.tsx lo!
    return NextResponse.json({
      ok: true,
      limit: finalLimit,
      locked: finalLocked
    });

  } catch (error) {
    // Fallback darurat jika database down biar web gak crash blank hitam
    return NextResponse.json({ ok: true, limit: 5, locked: false });
  }
  }
