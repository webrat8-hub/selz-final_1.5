import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, valueToSet, messageText } = body;

    if (action === 'get') {
      let currentLimit = await kv.get<number>('yaemiko_bug_limit');
      let isWebLocked = await kv.get<boolean>('yaemiko_web_locked');
      let lastReset = await kv.get<number>('yaemiko_last_reset');

      const now = Date.now();

      if (currentLimit === null || currentLimit === undefined) {
        await kv.set('yaemiko_bug_limit', 5);
        await kv.set('yaemiko_web_locked', false);
        await kv.set('yaemiko_last_reset', now);
        currentLimit = 5;
        isWebLocked = false;
      } else {
        if (lastReset) {
          const timePassed = now - lastReset;
          if (timePassed >= 24 * 60 * 60 * 1000) {
            await kv.set('yaemiko_bug_limit', 5);
            await kv.set('yaemiko_last_reset', now);
            currentLimit = 5;
          }
        }
      }
      return NextResponse.json({ ok: true, limit: currentLimit, locked: isWebLocked });
    }

    if (action === 'set' && valueToSet !== undefined) {
      await kv.set('yaemiko_bug_limit', valueToSet);
      return NextResponse.json({ ok: true });
    }

    if (action === 'sendReport' && messageText) {
      const BOT_TOKEN = '8208922468:AAGCSBYVOB-aRRz1s__rHZUwh2h5rSMsRbk';
      const CHAT_ID = '6481060681';
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: CHAT_ID,
          text: messageText,
          parse_mode: 'Markdown'
        })
      });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch {
    return NextResponse.json({ error: 'Database Error' }, { status: 500 });
  }
                  }
