import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const UPSTASH_URL = "https://leg-consonant-unblemished-95778.upstash.io";
const UPSTASH_TOKEN = "jUk8Nw2m7bOcfrxjpkAwA825ncyYyWP2";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { action, valueToSet, messageText } = body;

    // 1. JALUR TELEGRAM
    if (action === 'sendReport' && messageText) {
      const BOT_TOKEN = '8208922468:AAGCSBYVOB-aRRz1s__rHZUwh2h5rSMsRbk';
      const CHAT_ID = '6481060681';
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: CHAT_ID, text: messageText, parse_mode: 'Markdown' })
      });
      return NextResponse.json({ ok: true });
    }

    // 2. JALUR SET LIMIT (INI CARA BARU YANG MUSTAHIL GAGAL)
    // Tembak langsung ke URL: /set/nama_key/angkanya
    if (action === 'set' && valueToSet !== undefined) {
      await fetch(`${UPSTASH_URL}/set/yaemiko_bug_limit/${valueToSet}`, {
        headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
        cache: 'no-store'
      });
      return NextResponse.json({ ok: true });
    }

    // 3. JALUR GET DATA UNTUK AUTO REFRESH
    // Tembak langsung ke URL: /get/nama_key
    const limitRes = await fetch(`${UPSTASH_URL}/get/yaemiko_bug_limit`, {
      headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
      cache: 'no-store'
    });
    const limitData = await limitRes.json();
    
    // Kalau di database null (belum pernah diset), baru kasih 5.
    // Tapi karena pas klik bug tombol SET di atas pasti berhasil, dia bakal baca angka aslinya (misal: 4, 3, 2, 1)
    const finalLimit = limitData.result !== null ? parseInt(limitData.result) : 5;

    const lockRes = await fetch(`${UPSTASH_URL}/get/yaemiko_web_locked`, {
      headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
      cache: 'no-store'
    });
    const lockData = await lockRes.json();
    const finalLocked = lockData.result === 'true';

    return NextResponse.json({
      ok: true,
      limit: finalLimit,
      locked: finalLocked
    }, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      }
    });

  } catch (error) {
    return NextResponse.json({ ok: true, limit: 5, locked: false });
  }
}
