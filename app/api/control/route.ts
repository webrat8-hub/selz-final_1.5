import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

const UPSTASH_URL = "https://leg-consonant-unblemished-95778.upstash.io";
const UPSTASH_TOKEN = "jUk8Nw2m7bOcfrxjpkAwA825ncyYyWP2";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { action, valueToSet, messageText } = body;
    const timeBuster = Date.now();

    // ==========================================
    // 1. JALUR UTILITY BUAT BOT LU (LOCK / RESET)
    // ==========================================
    if (action === 'botLockWeb') {
      await fetch(`${UPSTASH_URL}/set/yaemiko_web_locked/true?t=${timeBuster}`, {
        headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
        cache: 'no-store'
      });
      return NextResponse.json({ ok: true, message: "Web Berhasil Di-Lock!" });
    }

    if (action === 'botUnlockWeb') {
      await fetch(`${UPSTASH_URL}/set/yaemiko_web_locked/false?t=${timeBuster}`, {
        headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
        cache: 'no-store'
      });
      return NextResponse.json({ ok: true, message: "Web Berhasil Di-Unlock!" });
    }

    if (action === 'botResetLimit') {
      await fetch(`${UPSTASH_URL}/set/yaemiko_bug_limit/5?t=${timeBuster}`, {
        headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
        cache: 'no-store'
      });
      return NextResponse.json({ ok: true, message: "Limit Berhasil Di-Reset ke 5!" });
    }

    // ==========================================
    // 2. JALUR LAPORAN TELEGRAM REPORT
    // ==========================================
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

    // ==========================================
    // 3. JALUR SET LIMIT (SAAT USER KLIK TOMBOL BUG)
    // ==========================================
    if (action === 'set' && valueToSet !== undefined) {
      await fetch(`${UPSTASH_URL}/set/yaemiko_bug_limit/${valueToSet}?t=${timeBuster}`, {
        headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
        cache: 'no-store'
      });
      return NextResponse.json({ ok: true });
    }

    // ==========================================
    // 4. JALUR GET DATA (LOGIKA YANG SUDAH DIBERSIHKAN TOTAL)
    // ==========================================
    const limitRes = await fetch(`${UPSTASH_URL}/get/yaemiko_bug_limit?t=${timeBuster}`, {
      headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
      cache: 'no-store'
    });
    const limitData = await limitRes.json();
    
    // Logika bersih: Ambil mentah-mentah dari database, JANGAN PERNAH maksa nulis / ngeriset angka 5 dari server!
    let finalLimit = 5; 
    if (limitData && limitData.result !== null && limitData.result !== undefined) {
      finalLimit = Number(limitData.result);
    }

    const lockRes = await fetch(`${UPSTASH_URL}/get/yaemiko_web_locked?t=${timeBuster}`, {
      headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
      cache: 'no-store'
    });
    const lockData = await lockRes.json();
    const finalLocked = lockData.result === 'true';

    // Kirim respon balik ke web
    const response = NextResponse.json({
      ok: true,
      limit: finalLimit,
      locked: finalLocked
    });

    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');

    return response;

  } catch (error) {
    // Jalur aman darurat kalau database down
    return NextResponse.json({ ok: true, limit: 5, locked: false });
  }
  }
