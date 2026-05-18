import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const BOT_TOKEN = '8208922468:AAGCSBYVOB-aRRz1s__rHZUwh2h5rSMsRbk';
const CHAT_ID = '6481060681'; // ID Akun Telegram Selz

// 1. Fungsi Mandiri buat Ubah Data di Redis Upstash
async function runRedis(command: string[]) {
  const url = "https://leg-consonant-unblemished-95778.upstash.io";
  const token = "jUk8Nw2m7bOcfrxjpkAwA825ncyYyWP2";
  const res = await fetch(`${url}/${command.join('/')}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store'
  });
  return await res.json();
}

// 2. Fungsi Kirim Pesan / Laporan Balik ke Telegram Selz
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
    console.error("Gagal kirim laporan ke Telegram:", e);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // JALUR 1: Menerima Perintah dari Bot Telegram Lo
    if (body && body.message) {
      const msg = body.message;
      const senderId = msg.from?.id?.toString(); // Cek ID orang yang ngetik
      const command = msg.text?.toLowerCase().trim();

      // Pastikan CUMA Selz yang bisa ngontrol botnya
      if (senderId === CHAT_ID) {
        if (command === '/resetlimit' || command === '/risetlimit') {
          await runRedis(['SET', 'yaemiko_bug_limit', '5']);
          await sendTelegramMessage("✅ *Suksess!* Limit harian web udah berhasil Selz reset jadi *5/5* kembali.");
        } else if (command === '/lockweb') {
          await runRedis(['SET', 'yaemiko_web_locked', 'true']);
          await sendTelegramMessage("🔒 *Suksess!* Website sekarang dalam kondisi *TERKUNCI* ketat oleh Selz.");
        } else if (command === '/unlockweb') {
          await runRedis(['SET', 'yaemiko_web_locked', 'false']);
          await sendTelegramMessage(" 🔓 *Suksess!* Website udah di *BUKA* kembali, user bisa bebas pakai.");
        }
      }
      return NextResponse.json({ ok: true });
    }

    // JALUR 2: Menerima Laporan dari Form Website (Login/Kirim Bug)
    // Jika web lo ngirim data bertipe data log biasa
    if (body && (body.type === 'login_alert' || body.type === 'bug_report' || body.messageText)) {
      const pesanLaporan = body.messageText || `⚠️ *Notifikasi Web:* \n${JSON.stringify(body)}`;
      await sendTelegramMessage(pesanLaporan);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ ok: true });
  }
}
