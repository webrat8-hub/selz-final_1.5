import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function runRedis(command: string[]) {
  const url = "https://leg-consonant-unblemished-95778.upstash.io";
  const token = "jUk8Nw2m7bOcfrxjpkAwA825ncyYyWP2";
  await fetch(`${url}/${command.join('/')}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store'
  });
}

const CHAT_ID = '6481060681';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (body && body.message) {
      const msg = body.message;
      
      if (msg.chat && msg.chat.id.toString() === CHAT_ID) {
        const command = msg.text?.toLowerCase().trim();

        if (command === '/resetlimit' || command === '/risetlimit') {
          await runRedis(['SET', 'yaemiko_bug_limit', '5']);
        } else if (command === '/lockweb') {
          await runRedis(['SET', 'yaemiko_web_locked', 'true']);
        } else if (command === '/unlockweb') {
          await runRedis(['SET', 'yaemiko_web_locked', 'false']);
        }
      }
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ ok: true });
  }
}
