import { NextResponse } from 'next/server';
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL || '');

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const CHAT_ID = '6481060681';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (body && body.message) {
      const msg = body.message;
      
      if (msg.chat && msg.chat.id.toString() === CHAT_ID) {
        const command = msg.text?.toLowerCase().trim();

        if (command === '/resetlimit' || command === '/risetlimit') {
          await redis.set('yaemiko_bug_limit', '5');
        } else if (command === '/lockweb') {
          await redis.set('yaemiko_web_locked', 'true');
        } else if (command === '/unlockweb') {
          await redis.set('yaemiko_web_locked', 'false');
        }
      }
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ ok: true });
  }
}
