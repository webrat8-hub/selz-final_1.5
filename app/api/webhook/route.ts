import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

const BOT_TOKEN = '8208922468:AAGCSBYVOB-aRRz1s__rHZUwh2h5rSMsRbk';
const CHAT_ID = '6481060681'; 

// Fungsi andalan nembak database via HTTP REST API (Ringan & Anti-Gagal Build)
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
    console.error("Gagal koneksi Upstash:", err);
    return null;
  }
}

async function sendTelegramMessage(text: string) {
  try {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: CHAT_ID, text: text, parse_mode: 'Markdown' }),
      cache: 'no-store'
    });
  } catch (e) {
    console.error("Gagal kirim Telegram:", e);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    
    // JALUR 1: Perintah dari Chat Telegram Lu
    if (body && body.message) {
      const msg = body.message;
      const senderId = msg.from?.id?.toString();
      const command = msg.text?.toLowerCase().trim();

      if (command === '/ping') {
        await sendTelegramMessage("🏓 *Pong!* Koneksi bot aman jaya Selz!");
        return NextResponse.json({ ok: true });
      }

      if (senderId === CHAT_ID) {
        if (command === '/resetlimit' || command === '/risetlimit') {
          await runRedis(['SET', 'yaemiko_bug_limit', '5']);
          await sendTelegramMessage("✅ *Sukses!* Limit harian web udah berhasil Selz reset jadi *5/5* kembali.");
        } else if (command === '/lockweb') {
          await runRedis(['SET', 'yaemiko_web_locked', 'true']);
          await sendTelegramMessage("🔒 *Sukses!* Website sekarang dalam kondisi *TERKUNCI* ketat oleh Selz.");
        } else if (command === '/unlockweb') {
          await runRedis(['SET', 'yaemiko_web_locked', 'false']);
          await sendTelegramMessage("🔓 *Sukses!* Website udah di *BUKA* kembali, user bisa bebas pakai.");
        }
      }
      return NextResponse.json({ ok: true });
    }

    // JALUR 2: Nerima laporan form dari web
    if (body) {
      const textLog = body.messageText || `⚠️ *Laporan Form Web Masuk:* \n\`\`\`json\n${JSON.stringify(body, null, 2)}\n\`\`\``;
      await sendTelegramMessage(textLog);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ ok: true });
  }
}
