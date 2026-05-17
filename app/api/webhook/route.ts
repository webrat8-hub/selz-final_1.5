import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Chat ID Telegram lo (Selz) sebagai pemegang kendali penuh
const CHAT_ID = '6481060681';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Pastikan data yang masuk adalah pesan teks dari Telegram
    if (body && body.message) {
      const msg = body.message;
      
      // Deteksi dan kunci: Hanya merespon jika dikirim dari Chat ID lo
      if (msg.chat && msg.chat.id.toString() === CHAT_ID) {
        const command = msg.text?.toLowerCase().trim();

        if (command === '/resetlimit' || command === '/risetlimit') {
          await kv.set('yaemiko_bug_limit', 5);
          await kv.set('yaemiko_last_reset', Date.now());
        } else if (command === '/lockweb') {
          await kv.set('yaemiko_web_locked', true);
        } else if (command === '/unlockweb') {
          await kv.set('yaemiko_web_locked', false);
        }
      }
    }
    
    // Wajib kirim sinyal 200 OK ke Telegram biar Telegram gak ngirim data yang sama berulang-ulang
    return NextResponse.json({ ok: true });
  } catch (err) {
    // Tetap return OK biar webhook gak ngadat/eror di sisi Telegram
    return NextResponse.json({ ok: true, error: 'Webhook Error' });
  }
}
