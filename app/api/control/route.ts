import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

const redis = new Redis({
  url: 'https://led-consonant-unblemished-95778.upstash.io',
  token: 'jUk8Nw2m7bOcfrxjpkAwA825ncyYyWP2',
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { action, valueToSet, messageText } = body;

    // Ambil data (Web Refresh)
    if (action === 'get_data') {
      const dbLimit = await redis.get('yaemiko_bug_limit');
      const dbLocked = await redis.get('yaemiko_web_locked');
      
      const finalLimit = dbLimit !== null && dbLimit !== undefined ? Number(dbLimit) : 5;
      const finalLocked = dbLocked === 'true' || dbLocked === true || dbLocked === '"true"';

      return NextResponse.json({ ok: true, limit: finalLimit, locked: finalLocked });
    }

    // Set Limit dari tombol web
    if (action === 'set' && valueToSet !== undefined) {
      await redis.set('yaemiko_bug_limit', valueToSet);
      return NextResponse.json({ ok: true });
    }

    // Kirim Telegram Report
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

    return NextResponse.json({ ok: false });
  } catch (error) {
    return NextResponse.json({ ok: true, limit: 5, locked: false });
  }
  }
