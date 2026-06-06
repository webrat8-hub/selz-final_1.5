import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

const redis = new Redis({ 
  url: process.env.UPSTASH_REDIS_REST_URL!, 
  token: process.env.UPSTASH_REDIS_REST_TOKEN! 
});

export async function POST(req: Request) {
  const { action, username, secret } = await req.json().catch(() => ({}));

  if (secret !== "LEONZKENEDYZ") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userKey = `user:${username}`;
  const userData = (await redis.get(userKey)) as any || { username, locked: false, limit: 5, isAdminBypassOn: false };

  if (action === 'reset_limit') {
    userData.limit = 5;
    await redis.set(userKey, JSON.stringify(userData));
  } else if (action === 'toggle_lock') {
    userData.locked = !userData.locked;
    await redis.set(userKey, JSON.stringify(userData));
  } else if (action === 'sender_on') {
    userData.isAdminBypassOn = true;
    await redis.set(userKey, JSON.stringify(userData));
  } else if (action === 'sender_off') {
    userData.isAdminBypassOn = false;
    await redis.set(userKey, JSON.stringify(userData));
  }

  return NextResponse.json({ success: true });
}
