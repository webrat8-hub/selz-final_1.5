import { NextRequest, NextResponse } from 'next/server';

// Matikan semua fitur caching Vercel secara paksa di level router
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

const UPSTASH_URL = "https://leg-consonant-unblemished-95778.upstash.io";
const UPSTASH_TOKEN = "jUk8Nw2m7bOcfrxjpkAwA825ncyYyWP2";

export async function POST(request: NextRequest) {
  try {
    // Trik 1: Baca header incoming request secara aktif agar Vercel tahu ini dynamic route
    const userAgent = request.headers.get('user-agent') || '';
    
    const body = await request.json().catch(() => ({}));
    const { action, valueToSet, messageText } = body;

    // Trik 2: Tambah timestamp unik di setiap request fetch agar Vercel terpaksa nembak live ke Upstash
    const timeBuster = Date.now();

    // 1. JALUR TELEGRAM REPORT
    if (action === 'sendReport' && messageText) {
      const BOT_TOKEN = '8208922468:AAGCSBYVOB-aRRz1s__rHZUwh2h5rSMsRbk';
      const CHAT_ID = '6481060681';
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage?t=${timeBuster}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: CHAT_ID, text: messageText, parse_mode: 'Markdown' }),
        cache: 'no-store'
      });
      return NextResponse.json({ ok: true });
    }

    // 2. JALUR SET LIMIT (SAAT KLIK TOMBOL BUG)
    if (action === 'set' && valueToSet !== undefined) {
      const setRes = await fetch(`${UPSTASH_URL}/set/yaemiko_bug_limit/${valueToSet}?t=${timeBuster}`, {
        headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
        method: 'GET',
        cache: 'no-store'
      });
      const setResult = await setRes.json();
      return NextResponse.json({ ok: true, sync: setResult.result });
    }

    // 3. JALUR GET DATA UNTUK AUTO-REFRESH SINKRONISASI
    const limitRes = await fetch(`${UPSTASH_URL}/get/yaemiko_bug_limit?t=${timeBuster}`, {
      headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
      method: 'GET',
      cache: 'no-store'
    });
    const limitData = await limitRes.json();
    const finalLimit = limitData.result !== null ? parseInt(limitData.result) : 5;

    const lockRes = await fetch(`${UPSTASH_URL}/get/yaemiko_web_locked?t=${timeBuster}`, {
      headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
      method: 'GET',
      cache: 'no-store'
    });
    const lockData = await lockRes.json();
    const finalLocked = lockData.result === 'true';

    // Trik 3: Kirim response balik dengan header anti-cache paling ketat di HTTP standar
    const response = NextResponse.json({
      ok: true,
      limit: finalLimit,
      locked: finalLocked
    });

    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    response.headers.set('Surrogate-Control', 'no-store');

    return response;

  } catch (error) {
    return NextResponse.json({ ok: true, limit: 5, locked: false });
  }
}
