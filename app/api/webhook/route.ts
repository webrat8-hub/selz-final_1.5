import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const BOT_TOKEN = '8208922468:AAGCSBYVOB-aRRz1s__rHZUwh2h5rSMsRbk';
const CHAT_ID = '6481060681'; 

// Fungsi andalan buat ngubah data di database Upstash tanpa library rewel
async function runRedis(command: string[]) {
  try {
    const url = "https://leg-consonant-unblemished-95778.upstash.io";
    const token = "jUk8Nw2m7bOcfrxjpkAwA825ncyYyWP2";
    const res = await fetch(`${url}/${command.join('/')}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store'
    });
    return await res.json();
  } catch (err) {
    console.error("Gagal nyambung ke database:", err);
    return null;
  }
}

// Fungsi kirim pesan ke Telegram lo
async function sendTelegramMessage(text: string) {
  try {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: text,
        parse_mode: 'Markdown'
      })
    });
  } catch (e) {
    console.error("Gagal kirim ke Telegram:", e);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    
    // JALUR 1: Nerima perintah ketikan dari Telegram lo
    if (body && body.message) {
      const msg = body.message;
      const senderId = msg.from?.id?.toString();
      const command = msg.text?.toLowerCase().trim();

      // Fitur tes ping tetep kita nyalain buat patokan
      if (command === '/ping') {
        await sendTelegramMessage("🏓 *Pong!* Koneksi aman jaya Selz!");
        return NextResponse.json({ ok: true });
      }

      // Kendali database khusus Akun Selz
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

    // JALUR 2: Nerima tembakan laporan/notifikasi dari form web lo
    if (body) {
      // Jika kodingan web lo ngirim data log, ini bakal otomatis diterusin ke Telegram lo
      const textLog = body.messageText || `⚠️ *Laporan Form Web Masuk:* \n\`\`\`json\n${JSON.stringify(body, null, 2)}\n\`\`\``;
      await sendTelegramMessage(textLog);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ ok: true });
  }
}
