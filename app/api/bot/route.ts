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
    const { action } = body;

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

    return NextResponse.json({ ok: false, error: "Action Bot Not Found" });
  } catch (error) {
    return NextResponse.json({ ok: false, error: "Internal Bot Error" });
  }
}
