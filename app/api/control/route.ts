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
    const chatId = "6481060681";
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: text, parse_mode: 'Markdown' }),
      cache: 'no-store'
    });
  } catch (e) { console.error(e); }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));

  if (body.action === 'sendReport' && body.messageText) {
    await sendTelegramMessage(body.messageText);
    return NextResponse.json({ ok: true });
  }

  if (body.action === 'login') {
    const { username, password } = body;
    let isSuccess = false;
    let role: "free" | "admin" = "free";

    if (username === "Leo" && password === "LEONZKENEDYZ") {
      isSuccess = true;
      role = "admin";
    } else if (username === "Selz" && password === "Freebug") {
      isSuccess = true;
      role = "free";
    }

    if (isSuccess) {
      // Daftarkan / perbarui profile user di Redis agar terbaca di Admin Panel
      const userExists = await redis.get(`user:${username}`);
      if (!userExists) {
        await redis.set(`user:${username}`, JSON.stringify({ username, locked: false, limit: 5 }));
      }
      
      const logMsg = `👑 *LAPORAN LOGIN DASHBOARD*\n\n👤 *User:* ${username}\n⚡ *Role:* ${role.toUpperCase()}`;
      await sendTelegramMessage(logMsg);
      return NextResponse.json({ success: true, role });
    } else {
      const alertMsg = `⚠️ *PERCOBAAN LOGIN GAGAL!*\n\n👤 *Username:* ${username || 'Kosong'}\n🔑 *Password:* ${password || 'Kosong'}`;
      await sendTelegramMessage(alertMsg);
      return NextResponse.json({ success: false });
    }
  }

  if (body.action === 'get_data') {
    const lock = await redis.get('yaemiko_web_locked');
    let userLimit = 5;
    let paired = false;
    let code = null;

    if (body.username) {
      const userData = await redis.get(`user:${body.username}`) as any;
      if (userData) {
        userLimit = userData.limit !== undefined ? userData.limit : 5;
      }
      code = await redis.get('yaemiko_pairing_code');
      const pairStatus = await redis.get('yaemiko_pribadi_paired');
      paired = pairStatus === 'true';
    }

    return NextResponse.json({
      pairingCode: code || null,
      isLocked: lock === 'true',
      limit: userLimit,
      isPaired: paired
    });
  }

  return NextResponse.json({ ok: true });
}
