import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

const BOT_TOKEN = process.env.TELE_TOKEN; // taro di Vercel Environment Variables
const CHAT_ID = '6481060681'; // chat id lu, ga usah disembunyiin

async function runRedis(command: string[]) {
  try {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!url ||!token) {
      console.error("Env Redis belum di-set");
      return null;
    }

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

async function sendTelegramMessage(text: string) {
  try {
    if (!BOT_TOKEN) {
      console.error("Env TELE_TOKEN belum di-set");
      return;
    }

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

    // 1. Handler perintah chat Telegram
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
        } else if (command?.startsWith('/code')) {
          const code = command.split(' ')[1];
          if (code) {
            await runRedis(['SET', 'yaemiko_pairing_code', code, 'EX', '120']);
            await sendTelegramMessage(`✅ *Kode pairing ${code}* udah dikirim ke web. Berlaku 2 menit.`);
          }
        }
      }
      return NextResponse.json({ ok: true });
    }

    // 2. Handler dari frontend/web
    if (body && body.action) {
      if (body.action === 'set_code') {
        await runRedis(['SET', 'yaemiko_pairing_code', body.messageText, 'EX', '120']);
        return NextResponse.json({ success: true });
      }

      if (body.action === 'get_data') {
        const codeRes = await runRedis(['GET', 'yaemiko_pairing_code']);
        const lockRes = await runRedis(['GET', 'yaemiko_web_locked']);
        return NextResponse.json({
          pairingCode: codeRes?.result || null,
          isLocked: lockRes?.result === 'true'
        });
      }
    }

    // 3. Handler logs form dari web
    if (body) {
      const textLog = body.messageText || `⚠️ *Laporan Form Web Masuk:* \n\`\`json\n${JSON.stringify(body, null, 2)}\n\`\``;
      await sendTelegramMessage(textLog);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Error:", err);
    return NextResponse.json({ ok: true });
  }
    }
