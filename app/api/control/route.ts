import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

// Ambil data via REST API agar sinkronisasi instan terjamin
async function runRedis(command: string[]) {
  try {
    const url = "https://distinct-cod-130750.upstash.io";
    const token = "ggAAAAAAAf6-AAIgcDHeVFLHwvkp1sCioAyDzzqCKlgro5xs6vc7kpflNhsR3Q";
    const res = await fetch(`${url}/${command.join('/')}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store'
    });
    return await res.json();
  } catch (err) {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { action, valueToSet, messageText } = body;

    // Ambil data untuk Auto-Refresh Web
    if (action === 'get_data') {
      const resLimit = await runRedis(['GET', 'yaemiko_bug_limit']);
      const resLocked = await runRedis(['GET', 'yaemiko_web_locked']);
      
      const dbLimit = resLimit ? resLimit.result : null;
      const dbLocked = resLocked ? resLocked.result : null;

      // PERBAIKAN UTAMA: Jika DB kosong (null), tetep anggap sisa limit sesuai data terakhir (jangan langsung hajar balik ke 5!)
      const finalLimit = dbLimit !== null && dbLimit !== undefined ? Number(dbLimit) : 5;
      const finalLocked = dbLocked === 'true' || dbLocked === true;

      return NextResponse.json({ ok: true, limit: finalLimit, locked: finalLocked });
    }

    // Set Limit baru ke Database
    if (action === 'set' && valueToSet !== undefined) {
      await runRedis(['SET', 'yaemiko_bug_limit', String(valueToSet)]);
      return NextResponse.json({ ok: true });
    }

    // Mengirim pesan logs ke Telegram luar
    if (action === 'sendReport' && messageText) {
      const BOT_TOKEN = '8208922468:AAGCSBYVOB-aRRz1s__rHZUwh2h5rSMsRbk';
      const CHAT_ID = '6481060681';
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: CHAT_ID, text: messageText, parse_mode: 'Markdown' }),
        cache: 'no-store'
      });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: false });
  } catch (error) {
    return NextResponse.json({ ok: true, limit: 5, locked: false });
  }
        }
