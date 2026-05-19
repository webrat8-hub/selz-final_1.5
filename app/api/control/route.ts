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
    // 1. JALUR BARU: UTILITY BUAT BOT LU (LOCK / RESET)
    // ==========================================
    
    // Fitur /lockweb dari Bot
    if (action === 'botLockWeb') {
      await fetch(`${UPSTASH_URL}/set/yaemiko_web_locked/true?t=${timeBuster}`, {
        headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
        cache: 'no-store'
      });
      return NextResponse.json({ ok: true, message: "Web Berhasil Di-Lock!" });
    }

    // Fitur /unlockweb dari Bot
    if (action === 'botUnlockWeb') {
      await fetch(`${UPSTASH_URL}/set/yaemiko_web_locked/false?t=${timeBuster}`, {
        headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
        cache: 'no-store'
      });
      return NextResponse.json({ ok: true, message: "Web Berhasil Di-Unlock!" });
    }

    // Fitur /resetlimit dari Bot (Set ke 5 lagi)
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
    // 4. JALUR GET DATA (REALTIME AUTO-REFRESH WEB)
    // ==========================================
    const limitRes = await fetch(`${UPSTASH_URL}/get/yaemiko_bug_limit?t=${timeBuster}`, {
      headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
      cache: 'no-store'
    });
    const limitData = await limitRes.json();
    
    // JIKA DATABASE KOSONG (NULL), MAKA KITA PAKSA ISI 5 DI DATABASE DETIK ITU JUGA
    let finalLimit = 5;
    if (limitData.result !== null) {
      finalLimit = parseInt(limitData.result);
    } else {
      // Tambalan otomatis: isi database biar gak kosong dan gak bikin web labil balik ke 5 terus
      await fetch(`${UPSTASH_URL}/set/yaemiko_bug_limit/5?t=${timeBuster}`, {
        headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
        cache: 'no-store'
      });
    }

    const lockRes = await fetch(`${UPSTASH_URL}/get/yaemiko_web_locked?t=${timeBuster}`, {
      headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
      cache: 'no-store'
    });
    const lockData = await lockRes.json();
    const finalLocked = lockData.result === 'true';

    // Kirim data segar anti-cache
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
    return NextResponse.json({ ok: true, limit: 5, locked: false });
  }
        }
