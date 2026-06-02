import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
const redis = new Redis({ url: process.env.UPSTASH_REDIS_REST_URL!, token: process.env.UPSTASH_REDIS_REST_TOKEN! });

export async function POST(req: Request) {
  const { action, username, role, secret } = await req.json();
  if (secret !== process.env.ADMIN_PASSWORD) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  if (action === 'create') {
    await redis.set(`user:${username}`, JSON.stringify({ username, role, locked: false, created_at: Date.now() }));
    return NextResponse.json({ success: true });
  }

  if (action === 'reset_limit') {
    await redis.set(`quota:${username}`, 0);
    return NextResponse.json({ success: true });
  }

  if (action === 'toggle_lock') {
    const user = await redis.get(`user:${username}`) as any;
    if (!user) return NextResponse.json({ error: "User tidak ada" }, { status: 404 });
    user.locked = !user.locked;
    await redis.set(`user:${username}`, JSON.stringify(user));
    return NextResponse.json({ success: true, locked: user.locked });
  }

  return NextResponse.json({ error: "Invalid Action" }, { status: 400 });
}
