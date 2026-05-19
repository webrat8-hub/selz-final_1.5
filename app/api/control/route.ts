import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

// Sistem otomatis resmi dari Upstash, aman dari typo URL
const redis = new Redis({
  url: 'https://led-consonant-unblemished-95778.upstash.io',
  token: 'jUk8Nw2m7bOcfrxjpkAwA825ncyYyWP2',
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { action, valueToSet, messageText } = body;

    // ==========================================
    // 1. JALUR UTILITY BOT (LOCK & RESET)
    // ==========================================
    if (action === 'botLockWeb') {
      await redis.set('yaemiko_web_locked', 'true');
      return NextResponse.json({ ok: true, message: "Web Locked!" });
    }

    if (action === 'botUnlockWeb') {
      await redis.set('yaemiko_web_locked', 'false');
      return NextResponse.json({ ok: true, message: "Web Unlocked!" });
    }

    if (action === 'botResetLimit') {
      await redis.set('yaemiko_bug_limit', 5);
      return NextResponse.json({ ok: true, message: "Limit Reset ke 5!" });
    }

    // ==========================================
    // 2. JALUR TELEGRAM REPORT
    // ==========================================
    if (action === 'sendReport' && messageText) {
      const BOT_TOKEN = '8208922468:AAGCSBYVOB-aRRz1s__rHZUwh2h5rSMsRbk';
      const CHAT_ID = '6481060681';
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: CHAT_ID, text: messageText, parse_mode: 'Markdown' }),
        cache: 'no-store'
      });
      return NextResponse.json({ ok: true });
    }

    // ==========================================
    // 3. JALUR SET LIMIT USER (PAS KLIK TOMBOL BUG)
    // ==========================================
    if (action === 'set' && valueToSet !== undefined) {
      await redis.set('yaemiko_bug_limit', valueToSet);
      return NextResponse.json({ ok: true });
    }

    // ==========================================
    // 4. JALUR GET DATA ASLI (SINKRONISASI REALTIME)
    // ==========================================
    const dbLimit = await redis.get('yaemiko_bug_limit');
    const dbLocked = await redis.get('yaemiko_web_locked');
    
    let finalLimit = 5;
    if (dbLimit !== null && dbLimit !== undefined) {
      finalLimit = Number(dbLimit);
    }

    const finalLocked = dbLocked === 'true' || dbLocked === true;

    const response = NextResponse.json({
      ok: true,
      limit: finalLimit,
      locked: finalLocked
    });

    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
    return response;

  } catch (error) {
    return NextResponse.json({ ok: true, limit: 5, locked: false });
  }
}
