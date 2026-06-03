import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const redis = new Redis({ 
  url: process.env.UPSTASH_REDIS_REST_URL!, 
  token: process.env.UPSTASH_REDIS_REST_TOKEN! 
});

async function sendTelegramMessage(text: string) {
  try {
    const token = process.env.TELE_TOKEN;
    const chatId = '6481060681';
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: text, parse_mode: 'Markdown' }),
      cache: 'no-store'
    });
  } catch (e) { console.error(e); }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const CHAT_ID = '6481060681';

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
          // Reset limit user global "Selz" via Telegram remote
          const selzData = (await redis.get('user:Selz')) as any || { username: 'Selz', locked: false, limit: 5 };
          selzData.limit = 5;
          await redis.set('user:Selz', JSON.stringify(selzData));
          await sendTelegramMessage("✅ *Sukses!* Limit harian web Selz udah berhasil direset jadi *5/5* kembali.");
        } else if (command === '/lockweb') {
          await redis.set('yaemiko_web_locked', 'true');
          await sendTelegramMessage("🔒 *Sukses!* Website sekarang dalam kondisi *TERKUNCI* ketat oleh Selz.");
        } else if (command === '/unlockweb') {
          await redis.set('yaemiko_web_locked', 'false');
          await sendTelegramMessage("🔓 *Sukses!* Website udah di *BUKA* kembali, user bisa bebas pakai.");
        } else if (command?.startsWith('/code')) {
          const code = msg.text.split(' ')[1];
          if (code) {
            await redis.set('yaemiko_pairing_code', code, { ex: 120 });
            await sendTelegramMessage(`✅ *Kode pairing ${code}* udah dikirim ke web. Berlaku 2 menit.`);
          }
        }
      }
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Error Webhook:", err);
    return NextResponse.json({ ok: true });
  }
}
